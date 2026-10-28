import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { corDoSetor } from './cadastros/corDoSetor'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { montar, processo } from './testes/quadroDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const corClaraDaMarca = (opcao: Element | null) =>
  (opcao?.querySelector('.opcao-cor-do-setor') as HTMLElement | null)?.style.getPropertyValue('--cor-claro')

test('o filtro Setor mostra o quadradinho da cor do setor, sem a cor no nome da opção', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const opcao = within(await screen.findByLabelText('Setor')).getByRole('option', { name: 'TSA' })
  expect(corClaraDaMarca(opcao)).toBe(corDoSetor(13).claro)
})

test('o campo Setor do Novo processo mostra o quadradinho da cor de cada setor ativo', async () => {
  window.location.hash = '#/processos/novo'
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true, cor: 13 },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true, cor: 22 },
  ]
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={cadastros} processos={new ProcessosFalso()}
    versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  const formulario = within(await screen.findByRole('form', { name: 'Cadastrar processo' }))
  const campo = formulario.getByLabelText('Setor')
  await waitFor(() => expect(within(campo).getAllByRole('option').length).toBeGreaterThan(1))
  expect(corClaraDaMarca(within(campo).getByRole('option', { name: 'TSA — Setor Teste A' }))).toBe(corDoSetor(13).claro)
  expect(corClaraDaMarca(within(campo).getByRole('option', { name: 'TSB — Setor Teste B' }))).toBe(corDoSetor(22).claro)
})
