import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { Macroprocesso } from './cadastros/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  window.location.hash = '#/setores/macroprocessos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MACROPROCESSOS: Macroprocesso[] = [
  { id: 'm1', codigo: 'MPT02', nome: 'Gestão Fictícia de Teste', descricao: null, categoria: 'apoio', ativo: true },
  { id: 'm2', codigo: 'MPT01', nome: 'Planejamento Inventado de Teste', descricao: null, categoria: 'finalistico', ativo: true },
  { id: 'm3', codigo: null, nome: 'Zeladoria Inventada de Teste', descricao: null, categoria: null, ativo: true },
  { id: 'm4', codigo: null, nome: 'Arquivo Fictício de Teste', descricao: null, categoria: 'gerencial', ativo: true },
  { id: 'm5', codigo: 'MPT03', nome: 'Macroprocesso Extinto de Teste', descricao: null, categoria: 'apoio', ativo: false },
]

function cadastrosComMacroprocessos(macroprocessos = MACROPROCESSOS) {
  const cadastros = new CadastrosFalso()
  cadastros.macroprocessos = [...macroprocessos]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep', cadastros = cadastrosComMacroprocessos()) {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return cadastros
}

function linhasDaTabela() {
  return screen.getAllByRole('row').slice(1).map((linha) => linha.textContent)
}

test('o endereço da aba abre a lista, com a aba Macroprocessos destacada', async () => {
  montar()
  await screen.findByRole('cell', { name: 'Planejamento Inventado de Teste' })
  const abas = within(screen.getByRole('navigation', { name: 'Seções de Setores' }))
  expect(abas.getByRole('link', { name: 'Macroprocessos' }).getAttribute('aria-current')).toBe('page')
})

test('a tabela tem as colunas Código, Nome, Categoria, Setores e Situação', async () => {
  montar()
  await screen.findByRole('cell', { name: 'Planejamento Inventado de Teste' })
  expect(screen.getAllByRole('columnheader').map((coluna) => coluna.textContent))
    .toEqual(['Código', 'Nome', 'Categoria', 'Setores', 'Situação'])
})

test('a lista dos ativos vai pelo código e deixa os sem código depois, em ordem alfabética', async () => {
  montar()
  await screen.findByRole('cell', { name: 'Planejamento Inventado de Teste' })
  expect(linhasDaTabela()).toEqual([
    'MPT01Planejamento Inventado de TesteFinalístico0',
    'MPT02Gestão Fictícia de TesteApoio0',
    '—Arquivo Fictício de TesteGerencial0',
    '—Zeladoria Inventada de Teste—0',
  ])
})

test('ao abrir, os inativos ficam escondidos e a caixa "Mostrar inativos" vem desmarcada', async () => {
  montar()
  await screen.findByRole('cell', { name: 'Planejamento Inventado de Teste' })
  expect(screen.queryByRole('cell', { name: 'Macroprocesso Extinto de Teste' })).toBeNull()
  expect((screen.getByRole('checkbox', { name: 'Mostrar inativos' }) as HTMLInputElement).checked).toBe(false)
})

test('marcar a caixa mostra o inativo com a pílula "Inativo", na ordem do código', async () => {
  montar()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inativos' }))
  const linha = (await screen.findByRole('cell', { name: 'Macroprocesso Extinto de Teste' })).closest('tr') as HTMLElement
  expect(within(linha).getByText('Inativo').className).toContain('pilula')
  expect(linhasDaTabela().map((texto) => texto?.slice(0, 5))).toEqual(['MPT01', 'MPT02', 'MPT03', '—Arqu', '—Zela'])
})

test('enquanto carrega, mostra "Carregando macroprocessos…"', async () => {
  const cadastros = cadastrosComMacroprocessos()
  cadastros.segurarListaDeMacroprocessos = true
  montar('integrante_ep', cadastros)
  expect(await screen.findByText('Carregando macroprocessos…')).toBeTruthy()
})

test('sem macroprocessos, mostra "Nenhum macroprocesso cadastrado ainda."', async () => {
  montar('integrante_ep', new CadastrosFalso())
  expect(await screen.findByText('Nenhum macroprocesso cadastrado ainda.')).toBeTruthy()
})

test('só com inativos e a caixa desmarcada, mostra "Nenhum macroprocesso ativo para mostrar."', async () => {
  montar('integrante_ep', cadastrosComMacroprocessos([MACROPROCESSOS[4]]))
  expect(await screen.findByText('Nenhum macroprocesso ativo para mostrar.')).toBeTruthy()
})

test('se a lista falha, mostra o erro em vermelho e recupera com Tentar de novo', async () => {
  const cadastros = cadastrosComMacroprocessos()
  cadastros.falharListaDeMacroprocessos = true
  montar('integrante_ep', cadastros)
  const erro = await screen.findByText('Não foi possível carregar os macroprocessos. Verifique a conexão e tente de novo.')
  expect(erro.closest('.cadastros-erro')).not.toBeNull()
  cadastros.falharListaDeMacroprocessos = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('MPT01')).toBeTruthy()
})

test('a Consulta vê a lista sem [Novo macroprocesso]', async () => {
  montar('consulta')
  await screen.findByText('MPT01')
  expect(screen.queryByRole('button', { name: 'Novo macroprocesso' })).toBeNull()
})

test.each<Perfil>(['administrador', 'integrante_ep'])('%s vê [Novo macroprocesso]', async (perfil) => {
  montar(perfil)
  expect(await screen.findByRole('button', { name: 'Novo macroprocesso' })).toBeTruthy()
})
