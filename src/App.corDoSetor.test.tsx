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

async function abrirSetor(sigla: string) {
  fireEvent.click(await screen.findByRole('button', { name: sigla }))
  return within(await screen.findByRole('group', { name: 'Cor do setor' }))
}

test('o setor aberto traz a grade de 30 amostras com a cor atual marcada', async () => {
  montar()
  const grade = await abrirSetor('TSA')
  expect(grade.getAllByRole('radio')).toHaveLength(30)
  expect((grade.getByRole('radio', { name: 'azul claro' }) as HTMLInputElement).checked).toBe(true)
})

test('as cores de outros setores trazem "em uso por" e a própria cor não', async () => {
  montar()
  const grade = await abrirSetor('TSA')
  expect(grade.getByRole('radio', { name: 'coral claro, em uso por TSB' })).toBeTruthy()
  expect(grade.getByRole('radio', { name: 'coral médio, em uso por TSX' })).toBeTruthy()
  expect(grade.queryByRole('radio', { name: /em uso por TSA/ })).toBeNull()
})

test('trocar a cor e salvar grava a cor escolhida', async () => {
  const cadastros = montar()
  const grade = await abrirSetor('TSA')
  fireEvent.click(grade.getByRole('radio', { name: 'menta claro' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('button', { name: 'TSB' })
  expect(cadastros.setores[0].cor).toBe(4)
})

test('uma cor já usada por outro setor pode ser escolhida', async () => {
  const cadastros = montar()
  const grade = await abrirSetor('TSA')
  fireEvent.click(grade.getByRole('radio', { name: 'coral claro, em uso por TSB' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('button', { name: 'TSB' })
  expect(cadastros.setores[0].cor).toBe(1)
  expect(cadastros.setores[1].cor).toBe(1)
})

test('se a gravação falha, a cor escolhida continua marcada com a mensagem de hoje', async () => {
  const cadastros = montar()
  cadastros.falhaDeGravacao = 'sem conexão'
  const grade = await abrirSetor('TSA')
  fireEvent.click(grade.getByRole('radio', { name: 'menta claro' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toContain('A alteração não foi salva')
  expect((grade.getByRole('radio', { name: 'menta claro' }) as HTMLInputElement).checked).toBe(true)
  expect(cadastros.setores[0].cor).toBe(13)
})

test('a Consulta não vê a grade', async () => {
  montar('consulta')
  fireEvent.click(await screen.findByRole('button', { name: 'TSA' }))
  await screen.findByRole('button', { name: 'Voltar à lista' })
  expect(screen.queryByRole('group', { name: 'Cor do setor' })).toBeNull()
})

test('o Novo setor não tem a grade', async () => {
  montar()
  fireEvent.click(await screen.findByRole('button', { name: 'Novo setor' }))
  await screen.findByLabelText('Nome')
  expect(screen.queryByRole('group', { name: 'Cor do setor' })).toBeNull()
})

test('salvar só o nome mantém a cor do setor', async () => {
  const cadastros = montar()
  await abrirSetor('TSA')
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Setor Teste Renomeado' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('button', { name: 'TSB' })
  expect(cadastros.setores[0]).toMatchObject({ nome: 'Setor Teste Renomeado', cor: 13 })
})

test('salvar só o nome não envia a cor', async () => {
  const cadastros = montar()
  const enviados: unknown[] = []
  const editar = cadastros.editarSetor.bind(cadastros)
  cadastros.editarSetor = (id, dados) => { enviados.push(dados); return editar(id, dados) }
  await abrirSetor('TSA')
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Setor Teste Renomeado' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('button', { name: 'TSB' })
  expect(enviados).toEqual([{ nome: 'Setor Teste Renomeado', sigla: 'TSA', observacoes: null }])
})

test('se a lista de setores falha, a grade aparece sem as marcas de "em uso"', async () => {
  const cadastros = montar()
  const botao = await screen.findByRole('button', { name: 'TSA' })
  cadastros.falharLista = true
  fireEvent.click(botao)
  const grade = within(await screen.findByRole('group', { name: 'Cor do setor' }))
  expect(grade.getByRole('radio', { name: 'coral claro' })).toBeTruthy()
  expect(grade.queryByRole('radio', { name: /em uso por/ })).toBeNull()
})

test('com a lista de setores demorando, o formulário já aparece e a grade espera', async () => {
  const cadastros = montar()
  const botao = await screen.findByRole('button', { name: 'TSA' })
  cadastros.segurarLista = true
  fireEvent.click(botao)
  expect(await screen.findByLabelText('Nome')).toBeTruthy()
  expect(screen.queryByRole('group', { name: 'Cor do setor' })).toBeNull()
})
