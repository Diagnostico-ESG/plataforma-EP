import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Aprovacao } from './revisoes/tipos'
import { agoraDoVerso, escolherNoMenuDoProcesso, gavetaDaEtapa, versoAberto } from './testes/versoDoCartao'
import { APROVACAO, montar, versao, type Falsos } from './testes/aprovacaoNoVerso'
import { BIA } from './testes/processoNoVerso'

// Registrar a aprovação sem trava (ticket 05 de revisoes-aprovacao, histórias 40 a 44, 46 a 48): o botão do Agora só na
// Aprovação pelo setor, a versão mais recente, o E-protocolo opcional, a aprovação nova no lugar da anterior com o aviso,
// o resumo com [Editar aprovação], as recusas, a Consulta sem botões e o histórico. Registrar não move o processo.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const APROVADA: Aprovacao = {
  id: 'ap1', versao: 7, numeroEprotocolo: 'PROT-2026-0001', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-09',
  registradaPor: BIA.nome, registradaEm: '2026-10-12T15:00:00Z',
}
const jaAprovada = ({ revisoes }: Falsos) => { revisoes.aprovacoes.p1 = APROVADA }

async function abrirARegistro() {
  const agora = await agoraDoVerso()
  fireEvent.click(await agora.findByRole('button', { name: 'Registrar aprovação' }))
  return within(await screen.findByRole('dialog', { name: 'Registrar aprovação' }))
}

const registrar = (janela: ReturnType<typeof within>) => fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
const campo = (janela: ReturnType<typeof within>, nome: RegExp) => janela.getByLabelText(nome) as HTMLInputElement

test('o botão aparece só na Aprovação pelo setor', async () => {
  montar(versao(), { etapa: 'revisao_interna' })
  const agora = await agoraDoVerso()
  await waitFor(() => expect(agora.getByLabelText('Etapa')).toBeTruthy())
  expect(agora.queryByRole('button', { name: 'Registrar aprovação' })).toBeNull()
})

test('a janela mostra a versão aprovada; registrar sem número, link e data é aceito e não move o processo', async () => {
  const { revisoes } = montar(versao())
  const janela = await abrirARegistro()
  expect(janela.getByText('Versão aprovada: V8')).toBeTruthy()
  expect(janela.queryByRole('status')).toBeNull()
  registrar(janela)
  const agora = await agoraDoVerso()
  expect(await agora.findByText('V8 aprovada')).toBeTruthy()
  expect(agora.getByRole('button', { name: 'Editar aprovação' })).toBeTruthy()
  expect(revisoes.aprovacoes.p1).toMatchObject({ versao: 8, numeroEprotocolo: null, link: null, aprovadaEm: null })
  expect(((agora.getByLabelText('Etapa') as HTMLSelectElement).selectedOptions[0]).textContent).toBe(APROVACAO)
  expect(screen.queryByRole('dialog', { name: 'Registrar aprovação' })).toBeNull()
})

test('o E-protocolo preenchido aparece no resumo do Agora e na gaveta', async () => {
  montar(versao())
  const janela = await abrirARegistro()
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: ' PROT-9 ' } })
  fireEvent.change(campo(janela, /Link/), { target: { value: 'https://eprotocolo.example/b' } })
  registrar(janela)
  expect(await (await agoraDoVerso()).findByText('V8 aprovada · E-protocolo PROT-9')).toBeTruthy()
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByRole('link', { name: /^PROT-9/ })).toBeTruthy()
})

test('com aprovação registrada, a janela avisa que a nova toma o lugar da anterior, e a nova a substitui', async () => {
  const { revisoes } = montar(versao(), { ajustar: jaAprovada })
  const agora = await agoraDoVerso()
  expect(await agora.findByText('V7 aprovada · E-protocolo PROT-2026-0001')).toBeTruthy()
  fireEvent.click(agora.getByRole('button', { name: 'Registrar aprovação' }))
  const janela = within(await screen.findByRole('dialog', { name: 'Registrar aprovação' }))
  expect(janela.getByRole('status').textContent).toBe('Esta aprovação toma o lugar da aprovação da V7, registrada em 12/10/2026.')
  expect(janela.getByText('Versão aprovada: V8')).toBeTruthy()
  registrar(janela)
  expect(await agora.findByText('V8 aprovada')).toBeTruthy()
  expect(revisoes.aprovacoes.p1).toMatchObject({ id: 'ap1', versao: 8, numeroEprotocolo: null })
})

test('[Editar aprovação] corrige o número, o link e a data', async () => {
  montar(versao(), { ajustar: jaAprovada })
  const agora = await agoraDoVerso()
  fireEvent.click(await agora.findByRole('button', { name: 'Editar aprovação' }))
  const janela = within(await screen.findByRole('dialog', { name: 'Editar a aprovação da V7' }))
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: 'PROT-2' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  expect(await agora.findByText('V7 aprovada · E-protocolo PROT-2')).toBeTruthy()
})

test('sem versão, a janela diz que o processo ainda não tem versão e o botão fica desabilitado', async () => {
  montar(null)
  const janela = await abrirARegistro()
  expect(janela.getByText('O processo ainda não tem versão.')).toBeTruthy()
  expect((janela.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement).disabled).toBe(true)
})

test('as recusas do link e da data no futuro mostram a frase, mantendo o preenchido', async () => {
  const { revisoes } = montar(versao())
  const janela = await abrirARegistro()
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: 'PROT-3' } })
  fireEvent.change(campo(janela, /Link/), { target: { value: 'ftp://x.example/a' } })
  registrar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('O link do E-protocolo precisa começar com http:// ou https://.')
  expect(campo(janela, /Número do E-protocolo/).value).toBe('PROT-3')
  fireEvent.change(campo(janela, /Link/), { target: { value: 'https://eprotocolo.example/c' } })
  revisoes.falhaNaGravacao = new TravaDoBanco('A data 20/10/2026 está no futuro.')
  registrar(janela)
  await waitFor(() => expect(janela.getByRole('alert').textContent).toBe('A data 20/10/2026 está no futuro.'))
  expect(revisoes.aprovacoes.p1).toBeUndefined()
})

test('mover o processo para trás mantém a aprovação', async () => {
  const { revisoes } = montar(versao(), { ajustar: jaAprovada })
  const agora = await agoraDoVerso()
  await agora.findByText(/V7 aprovada/)
  fireEvent.change(agora.getByLabelText('Etapa'), { target: { value: 'e5' } })
  await waitFor(() => expect(((agora.getByLabelText('Etapa') as HTMLSelectElement).selectedOptions[0]).textContent).toBe('Validação com o setor'))
  expect(revisoes.aprovacoes.p1.versao).toBe(7)
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByText('V7 aprovada')).toBeTruthy()
})

test('a Consulta lê o resumo da aprovação, sem botões', async () => {
  montar(versao(), { ajustar: jaAprovada, perfil: 'consulta' })
  const agora = await agoraDoVerso()
  expect(await agora.findByText('V7 aprovada · E-protocolo PROT-2026-0001')).toBeTruthy()
  expect(agora.queryByRole('button', { name: /aprovação/ })).toBeNull()
})

test('o histórico mostra "Registrou a aprovação" e, na segunda, "Substituiu a aprovação"', async () => {
  montar(versao())
  let janela = await abrirARegistro()
  registrar(janela)
  const agora = await agoraDoVerso()
  await agora.findByText('V8 aprovada')
  fireEvent.click(agora.getByRole('button', { name: 'Registrar aprovação' }))
  janela = within(await screen.findByRole('dialog', { name: 'Registrar aprovação' }))
  registrar(janela)
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Registrar aprovação' })).toBeNull())
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Registrou a aprovação')).toBeTruthy()
  expect(verso.getByText('Substituiu a aprovação')).toBeTruthy()
})
