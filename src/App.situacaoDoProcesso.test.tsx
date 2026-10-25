import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido, SituacaoDoProcesso } from './processos/tipos'
import { CATALOGO_DE_TESTE, umProcessoLido } from './testes/processoDaLista'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { escolherNoMenuDoProcesso, janelaPorCima } from './testes/versoDoCartao'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// Em Relatório e modelagem técnica; suspenso e cancelado levam um motivo.
function processo(situacao: SituacaoDoProcesso = 'em_andamento'): ProcessoLido {
  const parado = situacao === 'suspenso' || situacao === 'cancelado'
  return umProcessoLido('Emitir Ofício', {
    id: 'p1', situacao, responsavel: null, motivoDaSituacao: parado ? 'Aguardando decisão' : null,
  }, situacao === 'concluido' ? 'concluidos' : 'relatorio_modelagem_tecnica')
}

type Montagem = { perfil?: Perfil; situacao?: SituacaoDoProcesso; ajustar?: (falso: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', situacao = 'em_andamento', ajustar }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.processos = [processo(situacao)]
  falso.etapasDoCatalogo = CATALOGO_DE_TESTE
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
const DE_SITUACAO = ['Suspender', 'Cancelar processo', 'Retomar']

// As ações de situação ficam no "⋯" do processo (verso do cartão, ticket 16); o menu fecha com Esc depois de lidas.
async function botoesDeSituacao(): Promise<string[]> {
  const aberto = await painel()
  await aberto.findByRole('heading', { name: 'Etapas' })
  fireEvent.click(aberto.getByRole('button', { name: 'Ações do processo' }))
  const itens = aberto.getAllByRole('menuitem').map((item) => item.textContent ?? '').filter((texto) => DE_SITUACAO.includes(texto))
  fireEvent.keyDown(aberto.getAllByRole('menuitem')[0], { key: 'Escape' })
  return itens
}

async function pedir(acao: string, titulo: string, motivo: string, rotuloDoBotao: string) {
  await escolherNoMenuDoProcesso(acao)
  const janela = within(screen.getByRole('dialog', { name: titulo }))
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: motivo } })
  fireEvent.click(janela.getByRole('button', { name: rotuloDoBotao }))
}

test.each([
  ['em_andamento', ['Suspender', 'Cancelar processo']],
  ['concluido', ['Suspender', 'Cancelar processo']],
  ['suspenso', ['Retomar', 'Cancelar processo']],
  ['cancelado', ['Retomar']],
] as const)('processo %s: os botões de situação são %j', async (situacao, esperados) => {
  montar({ situacao })
  expect(await botoesDeSituacao()).toEqual(esperados)
})

test('Consulta não vê os botões de situação', async () => {
  montar({ perfil: 'consulta' })
  expect(await botoesDeSituacao()).toEqual([])
})

test('a janela do motivo: botão desabilitado com o campo vazio, Cancelar e Esc fecham sem gravar', async () => {
  const falso = montar()
  await escolherNoMenuDoProcesso('Suspender')
  const janela = within(screen.getByRole('dialog', { name: 'Suspender o processo Emitir Ofício?' }))
  expect((janela.getByRole('button', { name: 'Suspender processo' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: '   ' } })
  expect((janela.getByRole('button', { name: 'Suspender processo' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  await escolherNoMenuDoProcesso('Suspender')
  act(() => (janelaPorCima() as HTMLDialogElement).close())
  expect(falso.processos[0].situacao).toBe('em_andamento')
})

test('suspender grava o motivo, mostra a pílula, o aviso e o Quadro marca o cartão', async () => {
  const falso = montar()
  await pedir('Suspender', 'Suspender o processo Emitir Ofício?', 'Aguardando decisão', 'Suspender processo')
  const aberto = await painel()
  expect(await aberto.findByText('Suspenso: Aguardando decisão')).toBeTruthy()
  expect(aberto.getAllByText('Suspenso').length).toBeGreaterThan(0)
  expect(falso.processos[0]).toMatchObject({ situacao: 'suspenso', motivoDaSituacao: 'Aguardando decisão' })
  await waitFor(() => expect(within(screen.getByRole('link', { name: /Emitir Ofício/ })).getByText('Suspenso')).toBeTruthy())
})

test('cancelar tira o cartão do Quadro e mostra o aviso de cancelado', async () => {
  montar()
  expect(await screen.findByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
  await pedir('Cancelar processo', 'Cancelar o processo Emitir Ofício?', 'Não será mapeado', 'Cancelar processo')
  const aberto = await painel()
  expect(await aberto.findByText('Cancelado: Não será mapeado')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('link', { name: /Emitir Ofício/ })).toBeNull())
})

test('retomar limpa o aviso, devolve as listas do Agora e o botão de suspender', async () => {
  const falso = montar({ situacao: 'suspenso' })
  await pedir('Retomar', 'Retomar o processo Emitir Ofício?', 'Decisão tomada', 'Retomar processo')
  const aberto = await painel()
  await waitFor(() => expect(aberto.queryByText(/^Suspenso:/)).toBeNull())
  expect(await botoesDeSituacao()).toEqual(['Suspender', 'Cancelar processo'])
  expect(aberto.getByRole('combobox', { name: 'Etapa' })).toBeTruthy()
  expect(falso.processos[0]).toMatchObject({ situacao: 'em_andamento', motivoDaSituacao: null })
})

test.each([
  ['suspenso', 'Suspenso: Aguardando decisão'],
  ['cancelado', 'Cancelado: Aguardando decisão'],
] as const)('com o processo %s, as listas do Agora somem e o aviso aparece', async (situacao, aviso) => {
  montar({ situacao })
  const aberto = await painel()
  expect(await aberto.findByText(aviso)).toBeTruthy()
  expect(aberto.queryByRole('combobox')).toBeNull()
  expect(aberto.queryByRole('button', { name: 'Assumir' })).toBeNull()
})

test('a Consulta também vê o aviso do processo parado', async () => {
  montar({ perfil: 'consulta', situacao: 'suspenso' })
  expect(await (await painel()).findByText('Suspenso: Aguardando decisão')).toBeTruthy()
})

test.each([
  [new TravaDoBanco('Este processo já está suspenso.'), 'Este processo já está suspenso.'],
  ['sem conexão', 'A alteração não foi salva: sem conexão.'],
])('falha ao suspender aparece como alerta, sem mudar a situação (%s)', async (falha, texto) => {
  const falso = montar({ ajustar: (f) => { f.falhaDeGravacao = falha } })
  await pedir('Suspender', 'Suspender o processo Emitir Ofício?', 'Motivo', 'Suspender processo')
  expect((await (await painel()).findByRole('alert')).textContent).toBe(texto)
  expect(falso.processos[0].situacao).toBe('em_andamento')
})

test('o histórico mostra Suspendeu, Cancelou e Retomou com o motivo', async () => {
  const evento = (id: number, acao: string, motivo: string): EventoDoCadastro => ({
    id, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao, entidade: 'processo', entidadeRef: 'p1',
    antes: { situacao: 'em_andamento' }, depois: { situacao: 'suspenso' }, motivo,
  })
  montar({ ajustar: (f) => {
    f.historicoDosProcessos = { p1: [evento(3, 'retomar', 'Decisão tomada'), evento(2, 'cancelar', 'Desistiram'), evento(1, 'suspender', 'Parou')] }
  } })
  await escolherNoMenuDoProcesso('Histórico')
  const aberto = await painel()
  for (const texto of ['Suspendeu', 'Cancelou', 'Retomou', 'Motivo: Decisão tomada', 'Motivo: Desistiram', 'Motivo: Parou']) {
    expect(await aberto.findByText(texto, { exact: false })).toBeTruthy()
  }
})
