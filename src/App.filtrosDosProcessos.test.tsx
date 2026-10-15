import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'

beforeEach(() => {
  window.location.hash = '#/processos/lista'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM: EtapaDoCatalogo = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }
const RELATORIO: EtapaDoCatalogo = { id: 'e5', codigo: 'relatorio', nome: 'Relatório técnico', ordem: 5, ativa: true }
const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    situacao: 'em_andamento', etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem },
    aguardandoOSetor: false, processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, etapasDoSetor: [], etapasDoProcesso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária'),
  processo('p2', 'Conferir Recibo', { tipo: 'subprocesso', processoPaiId: 'p1', responsavel: ANA }),
  processo('p3', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB', situacao: 'concluido', etapaAtual: null }),
  processo('p4', 'Arquivar Pasta', {
    setorId: 's2', setorSigla: 'TSB', macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois',
    etapaAtual: { codigo: RELATORIO.codigo, nome: RELATORIO.nome, ordem: RELATORIO.ordem }, tipo: 'a_classificar',
  }),
  processo('p5', 'Cadastrar Bem', { aguardandoOSetor: true, responsavel: ANA }),
]

type Montagem = { perfil?: Perfil }

function montar({ perfil = 'integrante_ep' }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM, RELATORIO]
  falso.processos = PROCESSOS
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} reunioes={new ReunioesFalso()} />)
}

// Os nomes nas linhas da Lista (o botão do nome), na ordem da tabela.
async function nomesNaLista(): Promise<string[]> {
  await screen.findAllByRole('cell')
  return within(screen.getByRole('table')).getAllByRole('button').map((botao) => botao.textContent ?? '')
}

async function escolher(rotulo: string, opcao: string) {
  const seletor = await screen.findByLabelText(rotulo)
  const valor = within(seletor).getByRole('option', { name: opcao }).getAttribute('value')
  fireEvent.change(seletor, { target: { value: valor } })
}

test('o filtro de Setor troca as linhas da Lista e vai para o endereço', async () => {
  montar()
  await escolher('Setor', 'TSB')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?setor=s2'))
  expect(await nomesNaLista()).toEqual(['Arquivar Pasta', 'Emitir Ofício'])
})

// Um teste por filtro: um teste só com todos os casos estourava o tempo sob carga e, ao estourar, deixava o
// endereço do caso seguinte (como responsavel=u1) vazar para o teste que vinha depois.
const CASOS: [string, string, string[]][] = [
  ['Macroprocesso', 'Macro Dois', ['Arquivar Pasta']],
  ['Etapa atual', 'Aguardando o setor', ['Cadastrar Bem']],
  ['Etapa atual', 'Relatório técnico', ['Arquivar Pasta']],
  ['Tipo', 'Subprocesso', ['Conferir Recibo']],
  ['Responsável', 'Ana Teste', ['Cadastrar Bem', 'Conferir Recibo']],
  ['Situação', 'Concluído', ['Emitir Ofício']],
]

test.each(CASOS)('o filtro %s = %s troca as linhas da Lista', async (rotulo, opcao, esperado) => {
  montar()
  await escolher(rotulo, opcao)
  await waitFor(async () => expect(await nomesNaLista()).toEqual(esperado))
})

test('a combinação de filtros é "e", e o endereço guarda os dois', async () => {
  montar()
  await escolher('Setor', 'TSA')
  await escolher('Tipo', 'Subprocesso')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?setor=s1&tipo=subprocesso'))
  expect(await nomesNaLista()).toEqual(['Conferir Recibo'])
})

test('recarregar com filtros no endereço: a mesma visão e os seletores preenchidos', async () => {
  window.location.hash = '#/processos/lista?setor=s2&situacao=concluido'
  montar()
  expect(await nomesNaLista()).toEqual(['Emitir Ofício'])
  expect((screen.getByLabelText('Setor') as HTMLSelectElement).value).toBe('s2')
  expect((screen.getByLabelText('Situação') as HTMLSelectElement).value).toBe('concluido')
})

test('Quadro: os filtros sem Situação; o painel e o fechar mantêm os filtros', async () => {
  window.location.hash = '#/processos'
  montar()
  await screen.findByLabelText('Setor')
  expect(screen.queryByLabelText('Situação')).toBeNull()
  await escolher('Setor', 'TSB')
  await waitFor(() => expect(window.location.hash).toBe('#/processos?setor=s2'))
  await waitFor(() => expect(screen.queryByRole('link', { name: /Pagar Diária/ })).toBeNull())
  fireEvent.click(screen.getByRole('link', { name: /Arquivar Pasta/ }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p4?setor=s2'))
  // O botão de fechar do "Carregando processo…" é trocado pelo do cabeçalho; clicar antes pegaria o que já saiu da tela.
  await screen.findByRole('heading', { name: 'Arquivar Pasta' })
  fireEvent.click(screen.getByRole('button', { name: 'Fechar o painel' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos?setor=s2'))
})

test('sem resultado: a mensagem e [Limpar filtros], que volta a mostrar tudo', async () => {
  window.location.hash = '#/processos/lista?setor=s2&tipo=subprocesso'
  montar()
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
  fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' }).at(-1) as HTMLElement)
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(await nomesNaLista()).toHaveLength(5)
})

test('[Limpar filtros] na barra só aparece com filtro ativo', async () => {
  montar()
  await screen.findByLabelText('Setor')
  expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull()
  await escolher('Tipo', 'Processo')
  fireEvent.click(await screen.findByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
})

test('a Consulta filtra a Lista, sem [Cadastrar processo]', async () => {
  montar({ perfil: 'consulta' })
  await escolher('Setor', 'TSB')
  await waitFor(async () => expect(await nomesNaLista()).toEqual(['Arquivar Pasta', 'Emitir Ofício']))
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})
