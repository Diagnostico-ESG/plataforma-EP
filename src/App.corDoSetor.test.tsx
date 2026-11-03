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

function corDoSeloDe(elemento: HTMLElement | null) {
  return elemento?.style.getPropertyValue('--cor-do-setor')
}

async function abrirMacroprocesso() {
  window.location.hash = '#/setores/macroprocessos'
  montar()
  fireEvent.click(await screen.findByRole('cell', { name: 'Planejamento Inventado' }))
  return within(await screen.findByRole('region', { name: 'Setores envolvidos' }))
}

// A tela só lê a cor que o banco deu ao setor; não há escolha no cadastro (ADR 0040).
test('a lista de setores mostra a sigla num selo com a cor de cada setor', async () => {
  montar()
  const botao = await screen.findByRole('button', { name: 'TSA' })
  expect(corDoSeloDe(within(botao).getByText('TSA'))).toBe('#881337')
})

test('os setores envolvidos mostram o selo, inclusive o do inativo, e o nome da célula segue sendo a sigla', async () => {
  const secao = await abrirMacroprocesso()
  expect(corDoSeloDe(within(secao.getByRole('cell', { name: 'TSA' })).getByText('TSA'))).toBe('#881337')
  const linhaInativa = within(secao.getByRole('cell', { name: 'TSX' }).closest('tr') as HTMLElement)
  expect(corDoSeloDe(linhaInativa.getByText('TSX'))).toBe('#804878')
  expect(linhaInativa.getByText('Inativo')).toBeTruthy()
})

test('o [Pôr setor] mostra o quadradinho da cor sem pôr a cor no nome da opção', async () => {
  const secao = await abrirMacroprocesso()
  const opcao = await within(secao.getByRole('combobox', { name: 'Setor a pôr' })).findByRole('option', { name: 'TSB — Setor Teste B' })
  expect(corDoSeloDe(opcao.querySelector<HTMLElement>('.opcao-cor-do-setor'))).toBe('#881337')
})
