import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/lista'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM: EtapaDoCatalogo = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro de Teste',
    situacao: 'em_andamento', etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária', { setorId: 's2', setorSigla: 'TSB', subprocessos: [{ id: 'p2', nome: 'Conferir Recibo', etapaAtual: null, situacao: 'em_andamento' }] }),
  processo('p2', 'Conferir Recibo', {
    setorId: 's2', setorSigla: 'TSB', tipo: 'subprocesso', processoPaiId: 'p1',
    processoPai: { id: 'p1', nome: 'Pagar Diária', etapaAtual: null, situacao: 'em_andamento' }, responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
  }),
  processo('p3', 'Emitir Ofício', { situacao: 'concluido', etapaAtual: null }),
  processo('p4', 'Arquivar Pasta', { situacao: 'cancelado' }),
  processo('p5', 'Cadastrar Bem', { etapaAtual: null }),
]

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = PROCESSOS, ajustar }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM]
  falso.processos = processos
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} />)
  return falso
}

async function linhas(): Promise<string[][]> {
  await screen.findAllByRole('cell') // a tabela de carregando não tem células visíveis
  const tabela = screen.getByRole('table')
  return within(tabela).getAllByRole('row').map((linha) =>
    within(linha).queryAllByRole(linha.querySelector('th') ? 'columnheader' : 'cell').map((celula) => celula.textContent ?? ''))
}

const alternancia = () => within(screen.getByRole('group', { name: 'Forma de ver os processos' }))
const faixa = () => within(screen.getByRole('navigation', { name: 'Áreas do sistema' }))

test('as colunas, a ordem por sigla e nome, todas as situações e o pai do subprocesso', async () => {
  montar()
  const [cabecalho, ...corpo] = await linhas()
  expect(cabecalho).toEqual(['Nome', 'Tipo', 'Setor', 'Macroprocesso', 'Etapa atual', 'Responsável', 'Situação'])
  expect(corpo).toEqual([
    ['Arquivar Pasta', 'Processo', 'TSA', 'Macro de Teste', 'Reunião de modelagem', '—', 'Cancelado'],
    ['Cadastrar Bem', 'Processo', 'TSA', 'Macro de Teste', '—', '—', 'Em andamento'],
    ['Emitir Ofício', 'Processo', 'TSA', 'Macro de Teste', '—', '—', 'Concluído'],
    ['Conferir Recibo↳ Pagar Diária', 'Subprocesso', 'TSB', 'Macro de Teste', 'Reunião de modelagem', 'Ana Teste', 'Em andamento'],
    ['Pagar Diária', 'Processo', 'TSB', 'Macro de Teste', 'Reunião de modelagem', '—', 'Em andamento'],
  ])
  expect(within(screen.getByRole('table')).getByText('Concluído').className).toContain('pilula')
})

test('clicar na linha abre o verso com a Lista escurecida atrás; fechar volta à Lista e ao botão da linha', async () => {
  montar()
  fireEvent.click((await screen.findAllByRole('cell', { name: 'TSA' }))[0])
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista/p4'))
  expect(await screen.findByRole('dialog', { name: /^Processo( |$)/ })).toBeTruthy()
  // O botão de fechar do "Carregando processo…" é trocado pelo do cabeçalho; clicar antes pegaria o que já saiu da tela.
  await screen.findByRole('heading', { name: 'Arquivar Pasta' })
  // O ::backdrop da janela escurece a Lista; o inert a tira do Tab e do leitor de tela.
  expect(screen.getByRole('table', { hidden: true }).closest('[inert]')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Fechar a janela' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  await waitFor(() => expect(document.activeElement?.id).toBe('linha-p4'))
})

test('no painel aberto da Lista, o link do subprocesso continua na Lista', async () => {
  window.location.hash = '#/processos/lista/p1'
  montar()
  fireEvent.click(await screen.findByRole('link', { name: 'Conferir Recibo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista/p2'))
})

test('carregando: o aviso e as linhas-fantasma', async () => {
  montar({ ajustar: (falso) => { falso.segurarListaDeProcessos = true } })
  expect((await screen.findByText('Carregando processos…')).getAttribute('role')).toBe('status')
  expect(document.querySelectorAll('.linha-fantasma').length).toBeGreaterThan(0)
})

test('erro ao carregar: a mensagem e [Tentar de novo], que carrega de novo', async () => {
  const falso = montar({ ajustar: (f) => { f.falharListaDeProcessos = true } })
  const alerta = await screen.findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar os processos. Verifique a conexão e tente de novo.')
  falso.falharListaDeProcessos = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('table')).toBeTruthy()
})

test('vazio: o estado vazio de sempre', async () => {
  montar({ processos: [] })
  expect(await screen.findByText('Nenhum processo cadastrado ainda.')).toBeTruthy()
})

test('a alternância Quadro | Lista troca a visão e marca a escolhida', async () => {
  window.location.hash = '#/processos'
  montar()
  await screen.findAllByRole('region')
  expect(alternancia().getByRole('button', { name: 'Quadro' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(alternancia().getByRole('button', { name: 'Lista' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(await screen.findByRole('table')).toBeTruthy()
  expect(alternancia().getByRole('button', { name: 'Lista' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(alternancia().getByRole('button', { name: 'Quadro' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

test('o item Lista da faixa lateral leva à Lista e fica marcado', async () => {
  window.location.hash = '#/setores'
  montar()
  await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(faixa().getByRole('button', { name: 'Lista' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(await screen.findByRole('table')).toBeTruthy()
  expect(faixa().getByRole('button', { name: 'Lista' }).getAttribute('aria-current')).toBe('page')
})

test('Integrante cadastra a partir da Lista; a Consulta vê a Lista sem o botão', async () => {
  montar()
  fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar processo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista/novo'))
  cleanup()
  window.location.hash = '#/processos/lista'
  montar({ perfil: 'consulta' })
  await screen.findByRole('table')
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})
