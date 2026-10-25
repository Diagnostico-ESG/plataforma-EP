import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido } from './processos/tipos'
import { escolherNoMenuDoProcesso, versoAberto } from './testes/versoDoCartao'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  // Só o relógio de Date: o resto dos temporizadores segue real, para o waitFor funcionar.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-19T12:00:00') })
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const PROCESSO: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'a_classificar', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
  etapaAtual: { codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5, id: 'e', posicao: 1, total: 1 },
  responsavel: null, origem: 'retomado', contexto: 'Contexto inventado', observacoes: null,
  processoPaiId: null, processoPai: null, subprocessos: [], motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null,
  etapasDoVerso: [],
}

function evento(id: number, ocorridoEm: string, mudancas: Partial<EventoDoCadastro> = {}): EventoDoCadastro {
  return { id, ocorridoEm: new Date(ocorridoEm).toISOString(), autor: 'Ana Teste', acao: 'criar', entidade: 'processo',
    entidadeRef: 'p1', antes: null, depois: { nome: 'Emitir Ofício', setor_sigla: 'TSA' }, ...mudancas }
}

const EVENTOS: EventoDoCadastro[] = [
  evento(3, '2026-10-19T09:05:00', { acao: 'suspender', antes: { situacao: 'em_andamento' }, depois: { situacao: 'suspenso' },
    motivo: 'Setor em mudança' }),
  evento(2, '2026-10-18T16:40:00', { acao: 'editar', autor: 'Beto Teste' }),
  evento(1, '2026-10-12T08:15:00'),
]

function montar(historico: EventoDoCadastro[] = EVENTOS) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [PROCESSO]
  falso.historicoDosProcessos = { p1: historico }
  render(<App acesso={AcessoFalso.logadoComo(USUARIO_DE_TESTE)} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return falso
}

async function abrirHistorico() {
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  await verso.findByRole('heading', { name: 'Histórico', level: 3 })
  return verso
}

const esc = (alvo: Element) => fireEvent.keyDown(alvo, { key: 'Escape' })

test('o Histórico agrupa por dia, do mais novo para o mais antigo', async () => {
  montar()
  const verso = await abrirHistorico()
  const dias = await verso.findAllByRole('heading', { level: 4 })
  expect(dias.map((dia) => dia.textContent)).toEqual(['Hoje', 'Ontem', '12/10'])
})

test('cada evento traz a hora, as iniciais de quem fez, a frase com o antes e depois e o motivo em linha própria', async () => {
  montar()
  const verso = await abrirHistorico()
  const hoje = within((await verso.findByRole('heading', { name: 'Hoje' })).closest('section') as HTMLElement)
  const item = hoje.getByRole('listitem')
  expect(within(item).getByText('09:05')).toBeTruthy()
  expect(within(item).getByRole('img', { name: 'Ana Teste' }).textContent).toBe('AT')
  expect(item.textContent).toContain('Suspendeu')
  expect(item.textContent).toContain('Antes: Situação: Em andamento')
  expect(item.textContent).toContain('Depois: Situação: Suspenso')
  expect(within(item).getByText(/Setor em mudança/).className).toContain('linha-do-tempo-motivo')
})

test('sem eventos: "Nenhuma alteração registrada ainda."', async () => {
  montar([])
  await escolherNoMenuDoProcesso('Histórico')
  expect(await (await versoAberto()).findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
})

test('se a leitura falha, mostra o erro e recupera com Tentar de novo', async () => {
  const falso = montar()
  falso.falharHistoricoDoProcesso = true
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Não foi possível carregar o histórico. Verifique a conexão e tente de novo.')).toBeTruthy()
  falso.falharHistoricoDoProcesso = false
  fireEvent.click(verso.getByRole('button', { name: 'Tentar de novo' }))
  expect(await verso.findByRole('heading', { name: 'Hoje' })).toBeTruthy()
})

test('o primeiro Esc volta ao verso e o segundo fecha a janela', async () => {
  montar()
  const verso = await abrirHistorico()
  esc(verso.getByRole('heading', { name: 'Histórico' }))
  expect(await verso.findByRole('region', { name: 'Etapas' })).toBeTruthy()
  expect(window.location.hash).toBe('#/processos/p1')
  esc(await screen.findByRole('heading', { name: 'Emitir Ofício', level: 2 }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

test('o Esc no Editar volta ao verso sem gravar', async () => {
  const falso = montar()
  await escolherNoMenuDoProcesso('Editar')
  const form = within(await (await versoAberto()).findByRole('form', { name: 'Editar processo' }))
  fireEvent.change(await form.findByLabelText('Nome'), { target: { value: 'Outro Nome' } })
  esc(form.getByLabelText('Nome'))
  expect(await (await versoAberto()).findByRole('region', { name: 'Etapas' })).toBeTruthy()
  expect(falso.processos[0].nome).toBe('Emitir Ofício')
})

test('recarregar com o Histórico aberto volta ao verso', async () => {
  montar()
  await abrirHistorico()
  cleanup()
  montar()
  expect(await (await versoAberto()).findByRole('region', { name: 'Etapas' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Histórico' })).toBeNull()
})
