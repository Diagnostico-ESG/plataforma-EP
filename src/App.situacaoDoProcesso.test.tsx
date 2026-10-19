import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, SituacaoDoProcesso } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { escolherNoMenuDoProcesso, janelaPorCima } from './testes/versoDoCartao'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM = 'Reunião de modelagem'
const RELATORIO = 'Relatório e modelagem técnica'

function doProcesso(ordem: number, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

// A modelagem concluída e o relatório em andamento, como no ticket 06.
function processo(situacao: SituacaoDoProcesso = 'em_andamento'): ProcessoLido {
  const parado = situacao === 'suspenso' || situacao === 'cancelado'
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao, etapaAtual: { codigo: 'c5', nome: RELATORIO, ordem: 5 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null,
    processoPaiId: null, processoPai: null, subprocessos: [],
    motivoDaSituacao: parado ? 'Aguardando decisão' : null, dataDaReuniao: null, ultimaVersao: null,
    etapasDoProcesso: [
      doProcesso(4, MODELAGEM, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' }),
      doProcesso(5, RELATORIO, { status: 'em_andamento', iniciadaEm: '2026-10-12' }),
    ],
  }
}

type Montagem = { perfil?: Perfil; situacao?: SituacaoDoProcesso; ajustar?: (falso: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', situacao = 'em_andamento', ajustar }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.processos = [processo(situacao)]
  falso.etapasDoCatalogo = [
    { id: 'e4', codigo: 'c4', nome: MODELAGEM, ordem: 4, ativa: true },
    { id: 'e5', codigo: 'c5', nome: RELATORIO, ordem: 5, ativa: true },
  ]
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} />)
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

test('retomar limpa o aviso, devolve as ações das etapas e o botão de suspender', async () => {
  const falso = montar({ situacao: 'suspenso' })
  await pedir('Retomar', 'Retomar o processo Emitir Ofício?', 'Decisão tomada', 'Retomar processo')
  const aberto = await painel()
  await waitFor(() => expect(aberto.queryByText(/^Suspenso:/)).toBeNull())
  expect(await botoesDeSituacao()).toEqual(['Suspender', 'Cancelar processo'])
  expect(aberto.getAllByRole('button', { name: /^Concluir / }).length).toBeGreaterThan(0)
  expect(falso.processos[0]).toMatchObject({ situacao: 'em_andamento', motivoDaSituacao: null })
})

test.each([
  ['suspenso', 'Suspenso: Aguardando decisão'],
  ['cancelado', 'Cancelado: Aguardando decisão'],
] as const)('com o processo %s, as ações das etapas somem e o aviso aparece', async (situacao, aviso) => {
  montar({ situacao })
  const aberto = await painel()
  expect(await aberto.findByText(aviso)).toBeTruthy()
  for (const nome of ['Concluir', 'Iniciar', 'Dispensar', 'Voltar a esta etapa', 'Corrigir datas']) {
    expect(aberto.queryByRole('button', { name: new RegExp(`^${nome}`) })).toBeNull()
  }
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
