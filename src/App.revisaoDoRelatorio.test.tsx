import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { UltimaVersao, UltimoRelatorio } from './processos/tipos'
import type { RevisaoInterna } from './revisoes/tipos'
import { montar } from './testes/aprovacaoNoVerso'
import { BIA, EU } from './testes/processoNoVerso'
import { agoraDoVerso, escolherNoMenuDoProcesso, gavetaDaEtapa, versoAberto } from './testes/versoDoCartao'

// As duas revisões (revisoes-aprovacao, ticket 07; ADR 0046): o [Registrar revisão] na Revisão do relatório, com as frases de
// relatório e sem escopo; o aviso do autor do relatório; o "Sem … para revisar." no Agora; a gaveta de cada revisão; a
// Consulta sem botões; o histórico com o nome da revisão.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// A V8 de Bia, enviada antes da passagem; o Relatório R2 (de quem está na tela, nesta passagem) corrige o V1 (de Bia).
const V8: UltimaVersao = { numero: 8, autorId: BIA.id, autorNome: BIA.nome, papeis: ['bpm', 'relatorio'], anterior: { numero: 7, autorId: BIA.id } }
const R2: UltimoRelatorio = { numero: 2, autorId: EU.id, autorNome: EU.nome, anterior: { numero: 1, autorId: BIA.id }, enviadoNestaPassagem: true }
const R1_DE_BIA: UltimoRelatorio = { numero: 1, autorId: BIA.id, autorNome: BIA.nome, enviadoNestaPassagem: false }

const noRelatorio = (ultimoRelatorio: UltimoRelatorio | null, perfil: 'integrante_ep' | 'consulta' = 'integrante_ep') =>
  montar(V8, { etapa: 'revisao_relatorio', perfil, mudancas: { ultimoRelatorio } })

async function abrirARegistro() {
  fireEvent.click(await (await versoAberto()).findByRole('button', { name: 'Registrar revisão' }))
  return within(await screen.findByRole('dialog', { name: 'Registrar revisão' }))
}

const opcao = (janela: ReturnType<typeof within>, nome: string | RegExp) => janela.getByRole('radio', { name: nome }) as HTMLInputElement

test('na Revisão do relatório, "sem alteração" vale para o relatório mais recente, sem campo de escopo', async () => {
  const { revisoes } = noRelatorio(R1_DE_BIA)
  const janela = await abrirARegistro()
  expect(janela.queryByText('Escopo da correção')).toBeNull()
  fireEvent.click(opcao(janela, 'Sem alteração: vale para o Relatório R1'))
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  expect(await (await agoraDoVerso()).findByText(`Sem alteração · Relatório R1 · ${EU.nome}`)).toBeTruthy()
  expect(revisoes.revisoes.p1[0]).toMatchObject({ etapa: 'revisao_relatorio', relatorioRevisado: 1, escopo: null })
})

test('"corrigida" fica desabilitada, com o motivo, quando nada foi enviado na passagem', async () => {
  noRelatorio(R1_DE_BIA)
  const janela = await abrirARegistro()
  expect(opcao(janela, /^Corrigida/).disabled).toBe(true)
  expect(janela.getByText('Nada foi enviado desde que o processo entrou nesta etapa.')).toBeTruthy()
})

test('com o relatório enviado na passagem, "corrigida" diz "o Relatório R2 corrige o Relatório R1" e grava o escopo relatório', async () => {
  const { revisoes } = noRelatorio(R2)
  const janela = await abrirARegistro()
  fireEvent.click(opcao(janela, 'Corrigida: o Relatório R2 corrige o Relatório R1'))
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  expect(await (await agoraDoVerso()).findByText('Corrigida · Relatório R2 corrige o Relatório R1')).toBeTruthy()
  expect(revisoes.revisoes.p1[0]).toMatchObject({ escopo: 'relatorio', relatorioRevisado: 1, relatorioCorrigido: 2 })
})

test('quem enviou o relatório revisado recebe o aviso amarelo, no Agora e na janela, e registra mesmo assim', async () => {
  const { revisoes } = noRelatorio({ ...R1_DE_BIA, autorId: EU.id, autorNome: EU.nome })
  expect((await agoraDoVerso()).getByText(`${EU.nome} enviou o Relatório R1; a revisão do relatório deveria ser de outra pessoa.`))
    .toBeTruthy()
  const janela = await abrirARegistro()
  fireEvent.click(opcao(janela, 'Sem alteração: vale para o Relatório R1'))
  expect(janela.getByRole('status').textContent).toBe('Você enviou o Relatório R1. A revisão do relatório deveria ser de outra pessoa.')
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  await waitFor(() => expect(revisoes.revisoes.p1).toHaveLength(1))
})

test('antes do registro, o Agora diz qual relatório se revisa; depois, o resumo do registro fica no lugar', async () => {
  noRelatorio(R1_DE_BIA)
  expect(await (await agoraDoVerso()).findByText('A revisar: Relatório R1')).toBeTruthy()
  const janela = await abrirARegistro()
  fireEvent.click(opcao(janela, 'Sem alteração: vale para o Relatório R1'))
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  const agora = await agoraDoVerso()
  expect(await agora.findByText(`Sem alteração · Relatório R1 · ${EU.nome}`)).toBeTruthy()
  expect(agora.queryByText('A revisar: Relatório R1')).toBeNull()
})

test('na Revisão do fluxograma, o Agora diz qual versão se revisa', async () => {
  montar(V8, { etapa: 'revisao_interna' })
  expect(await (await agoraDoVerso()).findByText('A revisar: V8')).toBeTruthy()
})

test('sem relatório numerado, o Agora diz "Sem relatório para revisar." no lugar do [Registrar revisão]', async () => {
  noRelatorio(null)
  expect(await (await agoraDoVerso()).findByText('Sem relatório para revisar.')).toBeTruthy()
  expect((await versoAberto()).queryByRole('button', { name: 'Registrar revisão' })).toBeNull()
})

test('na Revisão do fluxograma sem versão, o Agora diz "Sem versão para revisar."', async () => {
  montar(null, { etapa: 'revisao_interna' })
  expect(await (await agoraDoVerso()).findByText('Sem versão para revisar.')).toBeTruthy()
  expect((await versoAberto()).queryByRole('button', { name: 'Registrar revisão' })).toBeNull()
})

const ANTIGA: RevisaoInterna = {
  id: 'r-antiga', versaoRevisada: 7, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null,
  revisor: BIA.nome, revisadaEm: '2026-10-01',
}
const DO_RELATORIO: RevisaoInterna = {
  ...ANTIGA, id: 'r-relatorio', etapa: 'revisao_relatorio', versaoRevisada: 8, relatorioRevisado: 1, revisadaEm: '2026-10-05',
}

test('a gaveta de cada revisão mostra só as dela; a antiga (sem etapa) fica na Revisão do fluxograma', async () => {
  montar(V8, { etapa: 'revisao_setor', ajustar: ({ revisoes }) => { revisoes.revisoes.p1 = [DO_RELATORIO, ANTIGA] } })
  const doRelatorio = await gavetaDaEtapa('Revisão do relatório')
  expect(await doRelatorio.findByText(`Relatório R1 · ${BIA.nome} · 05/10/2026`)).toBeTruthy()
  expect(doRelatorio.queryByText(/^V7 ·/)).toBeNull()
  const doFluxograma = await gavetaDaEtapa('Revisão do fluxograma')
  expect(await doFluxograma.findByText(`V7 · ${BIA.nome} · 01/10/2026`)).toBeTruthy()
  expect(doFluxograma.queryByText(/^Relatório R1 ·/)).toBeNull()
})

test('a Consulta vê a revisão do relatório no Agora e na gaveta, sem botões', async () => {
  montar(V8, {
    etapa: 'revisao_relatorio', perfil: 'consulta', mudancas: { ultimoRelatorio: R1_DE_BIA },
    ajustar: ({ revisoes }) => { revisoes.revisoes.p1 = [{ ...DO_RELATORIO, daPassagemAberta: true }] },
  })
  expect(await (await agoraDoVerso()).findByText(`Sem alteração · Relatório R1 · ${BIA.nome}`)).toBeTruthy()
  const verso = await versoAberto()
  expect(verso.queryByRole('button', { name: 'Registrar revisão' })).toBeNull()
  expect(verso.queryByRole('button', { name: 'Editar revisão' })).toBeNull()
  const gaveta = await gavetaDaEtapa('Revisão do relatório')
  expect(gaveta.queryByRole('button', { name: /Editar/ })).toBeNull()
})

test('o histórico mostra "Registrou a revisão do relatório"', async () => {
  noRelatorio(R1_DE_BIA)
  const janela = await abrirARegistro()
  fireEvent.click(opcao(janela, 'Sem alteração: vale para o Relatório R1'))
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  await (await agoraDoVerso()).findByText(`Sem alteração · Relatório R1 · ${EU.nome}`)
  await escolherNoMenuDoProcesso('Histórico')
  expect(await (await versoAberto()).findByText('Registrou a revisão do relatório')).toBeTruthy()
})
