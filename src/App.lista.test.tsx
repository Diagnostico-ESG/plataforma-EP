import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { hojeLocal } from './processos/textoDaModelagemPiloto'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

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
    situacao: 'em_andamento', etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem, id: 'e', posicao: 1, total: 1 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária', { setorId: 's2', setorSigla: 'TSB', subprocessos: [{ id: 'p2', nome: 'Conferir Recibo', etapaAtual: null, situacao: 'em_andamento' }] }),
  processo('p2', 'Conferir Recibo', {
    setorId: 's2', setorSigla: 'TSB', tipo: 'subprocesso', processoPaiId: 'p1',
    processoPai: { id: 'p1', nome: 'Pagar Diária', etapaAtual: null, situacao: 'em_andamento' }, responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null }, etiqueta: 'em_andamento',
  }),
  processo('p3', 'Emitir Ofício', { situacao: 'concluido', etapaAtual: null, etiqueta: 'concluido' }),
  processo('p4', 'Arquivar Pasta', { situacao: 'cancelado' }),
  processo('p5', 'Cadastrar Bem', { etapaAtual: null }),
]

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = PROCESSOS, ajustar }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM]
  falso.processos = processos
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
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
  expect(cabecalho).toEqual(['Nome', 'Tipo', 'Setor', 'Macroprocesso', 'Etapa atual', 'Etiqueta', 'Responsável', 'Situação'])
  expect(corpo).toEqual([
    ['Arquivar Pasta', 'Processo', 'TSA', 'Macro de Teste', 'Reunião de modelagem · 1 de 1', 'A fazer', '—', 'Cancelado'],
    ['Cadastrar Bem', 'Processo', 'TSA', 'Macro de Teste', '—', 'A fazer', '—', 'Em andamento'],
    ['Emitir Ofício', 'Processo', 'TSA', 'Macro de Teste', '—', 'Concluído', '—', 'Concluído'],
    ['Conferir Recibo↳ Pagar Diária', 'Subprocesso', 'TSB', 'Macro de Teste', 'Reunião de modelagem · 1 de 1', 'Em andamento', 'Ana Teste', 'Em andamento'],
    ['Pagar Diária', 'Processo', 'TSB', 'Macro de Teste', 'Reunião de modelagem · 1 de 1', 'A fazer', '—', 'Em andamento'],
  ])
  expect(within(screen.getByRole('table')).getAllByText('Concluído').some((elemento) => elemento.className.includes('pilula'))).toBe(true)
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

function diaDeslocado(deslocamento: number): string {
  const data = new Date()
  data.setDate(data.getDate() + deslocamento)
  return hojeLocal(data)
}

test('a coluna Etapa atual traz a barra com o nome acessível "Etapa n de N: nome", e Etiqueta traz a pílula na cor do valor', async () => {
  montar()
  const linha = (await screen.findByRole('button', { name: 'Conferir Recibo' })).closest('tr') as HTMLElement
  expect(within(linha).getByRole('img', { name: 'Etapa 1 de 1: Reunião de modelagem' })).toBeTruthy()
  const etiqueta = linha.querySelector('.etiqueta')
  expect(etiqueta?.textContent).toBe('Em andamento')
  expect(etiqueta?.className).toContain('etiqueta-em_andamento')
})

test('o selo de parado aparece ao lado do nome com 8 dias na etapa e não com 7, nem em processo concluído', async () => {
  montar({
    processos: [
      processo('p1', 'Oito Dias', { entrouNaEtapaEm: diaDeslocado(-8) }),
      processo('p2', 'Sete Dias', { entrouNaEtapaEm: diaDeslocado(-7) }),
      processo('p3', 'Concluído Antigo', { situacao: 'concluido', etapaAtual: null, entrouNaEtapaEm: diaDeslocado(-40) }),
    ],
  })
  const selo = async (nome: string) => ((await screen.findByRole('button', { name: nome })).closest('tr') as HTMLElement).querySelector('.lista-parado')
  expect((await selo('Oito Dias'))?.textContent).toBe('8 dias nesta etapa')
  expect((await selo('Oito Dias'))?.querySelector('.pilula-atraso')).not.toBeNull()
  expect(await selo('Sete Dias')).toBeNull()
  expect(await selo('Concluído Antigo')).toBeNull()
})
