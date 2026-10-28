import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso, type SetorDoTeste } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
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

const SETORES: SetorDoTeste[] = [
  { id: 's1', sigla: 'AFT', nome: 'Assessoria Fictícia de Teste', observacoes: null, ativo: true },
  { id: 's2', sigla: 'CIT', nome: 'Coordenação Inventada de Teste', observacoes: 'Nota inventada', ativo: true },
  { id: 's3', sigla: 'EXT', nome: 'Setor Extinto de Teste', observacoes: null, ativo: false },
]

function cadastrosComSetores() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...SETORES]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep', cadastros = cadastrosComSetores()) {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return cadastros
}

function abas() {
  return within(screen.getByRole('navigation', { name: 'Seções de Setores' }))
}

test.each<Perfil>(['administrador', 'integrante_ep', 'consulta'])('o item Setores da faixa abre a área para %s', async (perfil) => {
  window.location.hash = ''
  montar(perfil)
  fireEvent.click(await screen.findByRole('button', { name: 'Setores' }))
  expect(await screen.findByRole('navigation', { name: 'Seções de Setores' })).toBeTruthy()
  expect(window.location.hash).toBe('#/setores')
})

test('o endereço #/setores abre a área direto, com a aba Setores destacada', async () => {
  montar()
  await screen.findByRole('navigation', { name: 'Seções de Setores' })
  expect(abas().getAllByRole('link').map((aba) => aba.textContent)).toEqual(['Setores', 'Macroprocessos', 'Histórico'])
  expect(abas().getByRole('link', { name: 'Setores' }).getAttribute('aria-current')).toBe('page')
})

test('trocar de aba põe a aba no endereço e a destaca', async () => {
  montar()
  fireEvent.click(await screen.findByRole('link', { name: 'Macroprocessos' }))
  await waitFor(() => expect(abas().getByRole('link', { name: 'Macroprocessos' }).getAttribute('aria-current')).toBe('page'))
  expect(window.location.hash).toBe('#/setores/macroprocessos')
  expect(await screen.findByText('Nenhum macroprocesso cadastrado ainda.')).toBeTruthy()
})

test('o endereço da aba Histórico sobrevive ao recarregar', async () => {
  window.location.hash = '#/setores/historico'
  montar()
  await screen.findByRole('navigation', { name: 'Seções de Setores' })
  expect(abas().getByRole('link', { name: 'Histórico' }).getAttribute('aria-current')).toBe('page')
})

function linhasDaTabela() {
  return screen.getAllByRole('row').slice(1).map((linha) => linha.textContent)
}

test('a lista mostra sigla e nome dos setores ativos, na ordem recebida', async () => {
  montar()
  await screen.findByText('AFT')
  expect(linhasDaTabela()).toEqual(['AFTAssessoria Fictícia de Teste0', 'CITCoordenação Inventada de Teste0'])
})

test('enquanto carrega, mostra "Carregando setores…"', async () => {
  const cadastros = cadastrosComSetores()
  cadastros.segurarLista = true
  montar('integrante_ep', cadastros)
  expect(await screen.findByText('Carregando setores…')).toBeTruthy()
})

test('sem setores, mostra "Nenhum setor cadastrado ainda."', async () => {
  montar('integrante_ep', new CadastrosFalso())
  expect(await screen.findByText('Nenhum setor cadastrado ainda.')).toBeTruthy()
})

test('se a lista falha, mostra o erro em vermelho e recupera com Tentar de novo', async () => {
  const cadastros = cadastrosComSetores()
  cadastros.falharLista = true
  montar('integrante_ep', cadastros)
  const erro = await screen.findByText('Não foi possível carregar os setores. Verifique a conexão e tente de novo.')
  expect(erro.closest('.cadastros-erro')).not.toBeNull()
  cadastros.falharLista = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('AFT')).toBeTruthy()
})

test('a Consulta vê a lista sem [Novo setor]', async () => {
  montar('consulta')
  await screen.findByText('AFT')
  expect(screen.queryByRole('button', { name: 'Novo setor' })).toBeNull()
})

test.each<Perfil>(['administrador', 'integrante_ep'])('%s vê [Novo setor]', async (perfil) => {
  montar(perfil)
  expect(await screen.findByRole('button', { name: 'Novo setor' })).toBeTruthy()
})
