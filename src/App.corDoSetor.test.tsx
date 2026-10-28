import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
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

// TSA (cor 13) e TSX (inativo, cor 22) estão no macroprocesso; TSB (cor 1) não.
function cadastrosComSetores() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true, cor: 13 },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true, cor: 1 },
    { id: 's4', sigla: 'TSX', nome: 'Setor Teste Extinto', observacoes: null, ativo: false, cor: 22 },
  ]
  cadastros.macroprocessos = [
    { id: 'm1', codigo: 'MPT01', nome: 'Planejamento Inventado', descricao: null, categoria: null, ativo: true },
  ]
  cadastros.vinculos = [
    { macroprocessoId: 'm1', setorId: 's1', observacao: null },
    { macroprocessoId: 'm1', setorId: 's4', observacao: null },
  ]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep', cadastros = cadastrosComSetores()) {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return cadastros
}

function corClaraDe(elemento: HTMLElement | null) {
  return elemento?.style.getPropertyValue('--cor-claro')
}

async function abrirMacroprocesso() {
  window.location.hash = '#/setores/macroprocessos'
  montar()
  fireEvent.click(await screen.findByRole('cell', { name: 'Planejamento Inventado' }))
  return within(await screen.findByRole('region', { name: 'Setores envolvidos' }))
}

test('a lista de setores mostra a sigla num selo com a cor de cada setor', async () => {
  montar()
  const botao = await screen.findByRole('button', { name: 'TSA' })
  expect(corClaraDe(within(botao).getByText('TSA'))).toBe('#C4D9F8')
})

test('o setor novo recebe a primeira cor livre e aparece com ela na lista', async () => {
  const cadastros = montar()
  fireEvent.click(await screen.findByRole('button', { name: 'Novo setor' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Núcleo Fictício' } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'NFT' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  const botao = await screen.findByRole('button', { name: 'NFT' })
  expect(cadastros.setores.at(-1)?.cor).toBe(2)
  expect(corClaraDe(within(botao).getByText('NFT'))).toBe('#C4F8ED')
})

test.each<Perfil>(['integrante_ep', 'consulta'])('o setor aberto mostra o selo da sigla para %s', async (perfil) => {
  montar(perfil)
  fireEvent.click(await screen.findByRole('button', { name: 'TSA' }))
  await screen.findByRole('button', { name: 'Voltar à lista' })
  const selos = screen.getAllByText('TSA').filter((el) => el.classList.contains('selo-do-setor'))
  expect(selos.length).toBeGreaterThan(0)
  expect(corClaraDe(selos[0])).toBe('#C4D9F8')
})

test('os setores envolvidos mostram o selo, inclusive o do inativo, e o nome da célula segue sendo a sigla', async () => {
  const secao = await abrirMacroprocesso()
  expect(corClaraDe(within(secao.getByRole('cell', { name: 'TSA' })).getByText('TSA'))).toBe('#C4D9F8')
  const linhaInativa = within(secao.getByRole('cell', { name: 'TSX' }).closest('tr') as HTMLElement)
  expect(corClaraDe(linhaInativa.getByText('TSX'))).toBe('#E7A6A6')
  expect(linhaInativa.getByText('Inativo')).toBeTruthy()
})

test('o [Pôr setor] mostra o quadradinho da cor sem pôr a cor no nome da opção', async () => {
  const secao = await abrirMacroprocesso()
  const opcao = await within(secao.getByRole('combobox', { name: 'Setor a pôr' })).findByRole('option', { name: 'TSB — Setor Teste B' })
  expect(corClaraDe(opcao.querySelector<HTMLElement>('.opcao-cor-do-setor'))).toBe('#F8C4C4')
})

test('o histórico dos cadastros não mostra a cor', async () => {
  window.location.hash = '#/setores/historico'
  const cadastros = cadastrosComSetores()
  const setor = { sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }
  cadastros.historico = [{
    id: 1, ocorridoEm: '2026-10-27T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'editar', entidade: 'setor',
    entidadeRef: 's1', antes: setor, depois: { ...setor, nome: 'Setor Teste Novo' },
  }]
  montar('integrante_ep', cadastros)
  await screen.findByRole('combobox', { name: 'Item' })
  expect(screen.getAllByRole('listitem')[0].textContent).not.toMatch(/cor/i)
})
