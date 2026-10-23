import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { hojeLocal } from './processos/textoDaReuniao'
import type { EtapaDoProcesso, ProcessoLido } from './processos/tipos'
import { CONCLUIDA, caminho, montar } from './testes/aprovacaoNoVerso'
import type { Falsos } from './testes/aprovacaoNoVerso'
import { agoraDoVerso, escolherNoMenuDoProcesso, versoAberto } from './testes/versoDoCartao'

// Registrar a publicação que aconteceu depois, no concluído e no arquivado, com as recusas de data (publicacao-e-
// arquivamento, ticket 02, histórias 30 a 34 e 43). A falsa de processos trata 13/10/2026 como hoje.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function concluidoNaoPublicado(): EtapaDoProcesso[] {
  return caminho().map((etapa) => (etapa.codigo === 'aprovacao_setor' ? { ...etapa, ...CONCLUIDA } : etapa))
}

const CONCLUIDO: Partial<ProcessoLido> = { situacao: 'concluido', etapaAtual: null, vaiParaPublicacao: false }

// A aprovação gravada em 05/10/2026: a data da publicação não pode ser antes dela.
function comAprovacao({ revisoes }: Falsos): void {
  revisoes.aprovacoes.p1 = {
    id: 'ap1', versao: 8, numeroEprotocolo: null, link: null, aprovadaEm: '2026-10-05', registradaPor: 'Bia Teste',
    registradaEm: '2026-10-05T12:00:00Z',
  }
}

async function abrirAJanela() {
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Registrar publicação' }))
  return within(screen.getByRole('dialog', { name: 'Registrar publicação' }))
}

const dataDa = (janela: ReturnType<typeof within>) => janela.getByLabelText('Data da publicação') as HTMLInputElement

test('a data vem com hoje, com hoje como máximo e a data da aprovação como mínimo', async () => {
  montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO, ajustar: comAprovacao })
  await waitFor(async () => {
    const janela = await abrirAJanela()
    expect(dataDa(janela).min).toBe('2026-10-05')
  })
  const data = dataDa(within(screen.getByRole('dialog', { name: 'Registrar publicação' })))
  expect(data.value).toBe(hojeLocal(new Date()))
  expect(data.max).toBe(hojeLocal(new Date()))
})

test('data futura e anterior à aprovação são recusadas, e a janela fica com o preenchido', async () => {
  montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO, ajustar: comAprovacao })
  const janela = await abrirAJanela()
  fireEvent.change(janela.getByLabelText('Nota (opcional)'), { target: { value: 'Diário Oficial' } })
  fireEvent.change(dataDa(janela), { target: { value: '2026-10-20' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  expect(await janela.findByText('A data 20/10/2026 está no futuro.')).toBeTruthy()
  fireEvent.change(dataDa(janela), { target: { value: '2026-10-01' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  expect(await janela.findByText('A data da publicação (01/10/2026) não pode ser antes da aprovação (05/10/2026).')).toBeTruthy()
  expect((janela.getByLabelText('Nota (opcional)') as HTMLTextAreaElement).value).toBe('Diário Oficial')
})

test('registrada, o processo fica em Concluídos como "Publicado em", sem o botão', async () => {
  const { falso } = montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO, ajustar: comAprovacao })
  const janela = await abrirAJanela()
  fireEvent.change(dataDa(janela), { target: { value: '2026-10-10' } })
  fireEvent.change(janela.getByLabelText('Nota (opcional)'), { target: { value: '  Diário Oficial nº 1  ' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  const agora = await agoraDoVerso()
  expect(await agora.findByText('Publicado em 10/10/2026')).toBeTruthy()
  expect(agora.queryByRole('button', { name: 'Registrar publicação' })).toBeNull()
  expect(falso.processos[0]).toMatchObject({ situacao: 'concluido', vaiParaPublicacao: true, publicadoEm: '2026-10-10' })
  expect(falso.chamadas.at(-1)).toMatchObject({ acao: 'registrar_publicacao', id: 'p1', nota: 'Diário Oficial nº 1' })
})

test('no arquivado, o registro deixa o processo arquivado', async () => {
  const { falso } = montar(null, { etapas: concluidoNaoPublicado(), mudancas: { ...CONCLUIDO, arquivadoEm: '2026-10-12T12:00:00Z' } })
  const janela = await abrirAJanela()
  fireEvent.change(dataDa(janela), { target: { value: '2026-10-10' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  const agora = await agoraDoVerso()
  expect(await agora.findByText('Publicado em 10/10/2026')).toBeTruthy()
  expect(agora.getByText('Arquivado')).toBeTruthy()
  expect(falso.processos[0].arquivadoEm).toBe('2026-10-12T12:00:00Z')
})

test('a falha ao gravar aparece em vermelho na janela, que fica aberta', async () => {
  montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO, ajustar: ({ falso }) => { falso.falhaDeGravacao = 'sem conexão' } })
  const janela = await abrirAJanela()
  fireEvent.change(dataDa(janela), { target: { value: '2026-10-10' } })
  fireEvent.click(janela.getByRole('button', { name: 'Salvar' }))
  expect((await janela.findByRole('alert')).textContent).toMatch(/sem conexão/)
  expect(dataDa(janela).value).toBe('2026-10-10')
})

test('o registro aparece no histórico do processo, com a nota', async () => {
  montar(null, { etapas: concluidoNaoPublicado(), mudancas: { ...CONCLUIDO, vaiParaPublicacao: true, publicadoEm: '2026-10-10' },
    ajustar: ({ falso }) => {
      falso.historicoDosProcessos.p1 = [{
        id: 1, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Bia Teste', acao: 'registrar_publicacao', entidade: 'processo',
        entidadeRef: 'p1', motivo: 'Diário Oficial nº 1',
        antes: { nome: 'Emitir Ofício', vai_para_publicacao: false, publicado_em: null },
        depois: { nome: 'Emitir Ofício', vai_para_publicacao: true, publicado_em: '2026-10-10' },
      }]
    } })
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Registrou a publicação')).toBeTruthy()
  expect(verso.getByText(/Diário Oficial nº 1/)).toBeTruthy()
})
