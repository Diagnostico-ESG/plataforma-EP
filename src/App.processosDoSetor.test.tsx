import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    situacao: 'em_andamento', etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, id: 'e', posicao: 1, total: 1 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária'),
  processo('p2', 'Conferir Recibo', { tipo: 'subprocesso', processoPaiId: 'p1', situacao: 'concluido', etapaAtual: null }),
  processo('p3', 'Arquivar Pasta', { situacao: 'cancelado', etapaAtual: { codigo: 'relatorio', nome: 'Relatório técnico', ordem: 5, id: 'e', posicao: 1, total: 1 } }),
  processo('p4', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB' }),
]

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = PROCESSOS, ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = processos
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return falso
}

async function abrirProcessosDoSetor() {
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  return within(await screen.findByRole('region', { name: 'Processos do setor' }))
}

async function linhasDa(secao: ReturnType<typeof within>): Promise<string[][]> {
  await secao.findAllByRole('cell')
  return secao.getAllByRole('row').slice(1).map((linha: HTMLElement) =>
    within(linha).getAllByRole('cell').map((celula) => celula.textContent ?? ''))
}

test('só os processos do setor, por nome, com tipo, etapa atual e situação', async () => {
  montar()
  const secao = await abrirProcessosDoSetor()
  expect(await linhasDa(secao)).toEqual([
    ['Arquivar Pasta', 'Processo', 'Relatório técnico', 'Cancelado'],
    ['Conferir Recibo', 'Subprocesso', '—', 'Concluído'],
    ['Pagar Diária', 'Processo', 'Reunião de modelagem', 'Em andamento'],
  ])
  expect(secao.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Nome', 'Tipo', 'Etapa atual', 'Situação'])
})

test('vazio: "Este setor ainda não tem processos."', async () => {
  montar({ processos: [processo('p4', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB' })] })
  const secao = await abrirProcessosDoSetor()
  expect(await secao.findByText('Este setor ainda não tem processos.')).toBeTruthy()
})

test('carregando: "Carregando processos do setor…"', async () => {
  montar({ ajustar: (falso) => { falso.segurarListaDeProcessos = true } })
  const secao = await abrirProcessosDoSetor()
  expect(secao.getByText('Carregando processos do setor…').getAttribute('role')).toBe('status')
})

test('erro: a mensagem e [Tentar de novo], que carrega de novo', async () => {
  const falso = montar({ ajustar: (f) => { f.falharListaDeProcessos = true } })
  const secao = await abrirProcessosDoSetor()
  const alerta = await secao.findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar os processos. Verifique a conexão e tente de novo.')
  falso.falharListaDeProcessos = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await linhasDa(secao)).toHaveLength(3)
})

test('clicar num processo abre o painel dele sobre a Lista do setor', async () => {
  montar()
  const secao = await abrirProcessosDoSetor()
  fireEvent.click(await secao.findByRole('cell', { name: 'Reunião de modelagem' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista/p1?setor=s1'))
  expect(await screen.findByRole('dialog', { name: /^Processo( |$)/ })).toBeTruthy()
})

test('a Consulta vê a mesma seção', async () => {
  montar({ perfil: 'consulta' })
  const secao = await abrirProcessosDoSetor()
  expect(await linhasDa(secao)).toHaveLength(3)
})
