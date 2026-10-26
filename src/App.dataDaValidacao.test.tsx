import { cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { agoraDoVerso, escolherNoMenuDoProcesso, gavetaDaEtapa, versoAberto } from './testes/versoDoCartao'
import { APROVACAO, REVISAO_DO_SETOR, montar, versao, type Falsos } from './testes/aprovacaoNoVerso'
import { ligarHistoricoDasVersoes } from './testes/pdfDaAprovacaoNoVerso'

// A data da validação no Agora da Validação com o setor e na gaveta dela (ticket 06 de revisoes-aprovacao, histórias 49 a 53
// e 62): marcar, alterar e apagar gravam na hora, a data futura é recusada, fora da etapa a data só se lê, e a Consulta só lê.
// O banco "hoje" das falsas é 13/10/2026.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const COM_DATA = ({ falso }: Falsos) => {
  falso.processos = falso.processos.map((processo) => ({ ...processo, dataDaValidacao: '2026-10-10' }))
}

async function campoDaData() {
  const agora = await agoraDoVerso()
  return within(await agora.findByRole('group', { name: 'Data da validação' }))
}

type Campo = Awaited<ReturnType<typeof campoDaData>>

const entrada = (campo: Campo) => campo.getByLabelText('Data da validação') as HTMLInputElement

async function abrirOCampo(rotulo: 'Marcar data' | 'Alterar data' = 'Marcar data'): Promise<Campo> {
  const campo = await campoDaData()
  fireEvent.click(campo.getByRole('button', { name: rotulo }))
  return campo
}

test('o campo aparece no Agora só na Validação com o setor, vazio até alguém preencher', async () => {
  montar(versao(), { etapa: 'revisao_setor' })
  const campo = await campoDaData()
  expect(campo.getByText('Ainda não marcada')).toBeTruthy()
  expect(campo.getByRole('button', { name: 'Marcar data' })).toBeTruthy()
})

test.each(['aprovacao_setor', 'revisao_interna'])('na etapa %s o Agora não tem o campo da data da validação', async (etapa) => {
  montar(versao(), { etapa })
  const agora = await agoraDoVerso()
  await waitFor(() => expect(agora.getByLabelText('Etapa')).toBeTruthy())
  expect(agora.queryByRole('group', { name: 'Data da validação' })).toBeNull()
})

test('marcar grava na hora: o Agora mostra a data e o processo a guarda', async () => {
  const { falso } = montar(versao(), { etapa: 'revisao_setor' })
  const campo = await abrirOCampo()
  fireEvent.change(entrada(campo), { target: { value: '2026-10-10' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  expect(await campo.findByText('10/10/2026')).toBeTruthy()
  expect(falso.processos[0].dataDaValidacao).toBe('2026-10-10')
  expect(campo.getByRole('button', { name: 'Alterar data' })).toBeTruthy()
})

test('alterar troca a data, e apagar a deixa vazia (a data é opcional)', async () => {
  const { falso } = montar(versao(), { etapa: 'revisao_setor', ajustar: COM_DATA })
  const campo = await abrirOCampo('Alterar data')
  expect(entrada(campo).value).toBe('2026-10-10')
  fireEvent.change(entrada(campo), { target: { value: '2026-10-11' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  expect(await campo.findByText('11/10/2026')).toBeTruthy()
  fireEvent.click(campo.getByRole('button', { name: 'Alterar data' }))
  fireEvent.click(campo.getByRole('button', { name: 'Remover' }))
  expect(await campo.findByText('Ainda não marcada')).toBeTruthy()
  expect(falso.processos[0].dataDaValidacao).toBeNull()
})

test('a data futura é recusada com a frase, e o campo mantém o que foi digitado', async () => {
  const { falso } = montar(versao(), { etapa: 'revisao_setor' })
  const campo = await abrirOCampo()
  fireEvent.change(entrada(campo), { target: { value: '2026-10-20' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  expect((await campo.findByRole('alert')).textContent).toBe('A data da validação não pode ser futura.')
  expect(entrada(campo).value).toBe('2026-10-20')
  expect(falso.processos[0].dataDaValidacao ?? null).toBeNull()
})

test('a falha ao gravar aparece em vermelho e a data anterior continua valendo', async () => {
  const { revisoes } = montar(versao(), { etapa: 'revisao_setor', ajustar: COM_DATA })
  const campo = await abrirOCampo('Alterar data')
  revisoes.falhaNaGravacao = 'sem conexão'
  fireEvent.change(entrada(campo), { target: { value: '2026-10-11' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  expect((await campo.findByRole('alert')).textContent).toBe('A data da validação não foi salva: sem conexão.')
  revisoes.falhaNaGravacao = null
  fireEvent.click(campo.getByRole('button', { name: 'Cancelar' }))
  expect(await campo.findByText('10/10/2026')).toBeTruthy()
})

test('uma recusa pronta do banco aparece como veio', async () => {
  const { revisoes } = montar(versao(), { etapa: 'revisao_setor' })
  const campo = await abrirOCampo()
  revisoes.falhaNaGravacao = new TravaDoBanco('Este processo está arquivado; desarquive-o para alterar.')
  fireEvent.change(entrada(campo), { target: { value: '2026-10-10' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  expect((await campo.findByRole('alert')).textContent).toBe('Este processo está arquivado; desarquive-o para alterar.')
})

test('a Consulta lê a data no Agora, sem botões', async () => {
  montar(versao(), { etapa: 'revisao_setor', perfil: 'consulta', ajustar: COM_DATA })
  const campo = await campoDaData()
  expect(await campo.findByText('10/10/2026')).toBeTruthy()
  expect(campo.queryByRole('button')).toBeNull()
})

test('a gaveta da Validação com o setor diz o dia em que o setor validou, também depois que o processo sai da etapa', async () => {
  montar(versao(), { etapa: 'aprovacao_setor', ajustar: COM_DATA })
  const gaveta = await gavetaDaEtapa(REVISAO_DO_SETOR)
  expect(await gaveta.findByText('Validado pelo setor em 10/10/2026')).toBeTruthy()
})

test('sem data, a gaveta diz que ela não foi registrada; a das outras etapas não traz a linha', async () => {
  montar(versao(), { etapa: 'aprovacao_setor' })
  const validacao = await gavetaDaEtapa(REVISAO_DO_SETOR)
  expect(await validacao.findByText('Data da validação não registrada.')).toBeTruthy()
  const aprovacao = await gavetaDaEtapa(APROVACAO)
  expect(aprovacao.queryByText(/Validado pelo setor|Data da validação não registrada/)).toBeNull()
})

test('o histórico mostra "Registrou a data da validação", "Alterou a data da validação" e a remoção', async () => {
  montar(versao(), { etapa: 'revisao_setor', ajustar: ligarHistoricoDasVersoes })
  let campo = await abrirOCampo()
  fireEvent.change(entrada(campo), { target: { value: '2026-10-10' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  await campo.findByText('10/10/2026')
  fireEvent.click(campo.getByRole('button', { name: 'Alterar data' }))
  fireEvent.change(entrada(campo), { target: { value: '2026-10-11' } })
  fireEvent.click(campo.getByRole('button', { name: 'Salvar' }))
  await campo.findByText('11/10/2026')
  campo = await abrirOCampo('Alterar data')
  fireEvent.click(campo.getByRole('button', { name: 'Remover' }))
  await campo.findByText('Ainda não marcada')
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Registrou a data da validação')).toBeTruthy()
  expect(verso.getAllByText('Alterou a data da validação')).toHaveLength(2)
})
