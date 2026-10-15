import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import type { ResponsavelDoSetor } from './processos/tipos'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BRUNO: ResponsavelDoSetor = { id: 'r2', nome: 'Bruno Teste', email: 'bruno.teste@exemplo.com', cargo: 'Chefe de Teste' }
const ANA: ResponsavelDoSetor = { id: 'r1', nome: 'Ana Teste', email: null, cargo: null }

type Montagem = { perfil?: Perfil; responsaveis?: ResponsavelDoSetor[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', responsaveis = [BRUNO, ANA], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const processos = new ProcessosFalso()
  processos.responsaveisDoSetor = { s1: responsaveis }
  ajustar?.(processos)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={processos} reunioes={new ReunioesFalso()} />)
  return processos
}

// Abre o setor TSA e devolve a seção "Responsáveis do setor".
async function abrirResponsaveis() {
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  return within(await screen.findByRole('region', { name: 'Responsáveis do setor' }))
}

async function linhasDa(secao: ReturnType<typeof within>): Promise<string[]> {
  const linhas = await secao.findAllByRole('row')
  return linhas.slice(1).map((linha: HTMLElement) => linha.textContent ?? '')
}

function preencher(secao: ReturnType<typeof within>, campos: { nome?: string; email?: string; cargo?: string }) {
  for (const [rotulo, valor] of [['Nome', campos.nome], ['E-mail', campos.email], ['Cargo', campos.cargo]]) {
    if (valor !== undefined) fireEvent.change(secao.getByLabelText(rotulo as string), { target: { value: valor } })
  }
}

function janelaAberta() {
  return within(screen.getByRole('dialog'))
}

test('a lista mostra nome, e-mail e cargo em ordem de nome, com Editar e Excluir', async () => {
  montar()
  const secao = await abrirResponsaveis()
  expect(await linhasDa(secao)).toEqual([
    expect.stringMatching(/^Ana Teste——EditarExcluir$/),
    expect.stringMatching(/^Bruno Testebruno\.teste@exemplo\.comChefe de TesteEditarExcluir$/),
  ])
  expect(secao.getByRole('button', { name: 'Novo responsável' })).toBeTruthy()
})

test('setor sem responsáveis mostra o vazio da spec', async () => {
  montar({ responsaveis: [] })
  const secao = await abrirResponsaveis()
  expect(await secao.findByText('Nenhum responsável cadastrado ainda.')).toBeTruthy()
})

test('mostra "Carregando responsáveis…" enquanto lê', async () => {
  montar({ ajustar: (processos) => { processos.segurarLeitura = true } })
  const secao = await abrirResponsaveis()
  expect(secao.getByRole('status').textContent).toBe('Carregando responsáveis…')
})

test('erro ao carregar tem o texto da spec e Tentar de novo', async () => {
  const processos = montar({ ajustar: (falso) => { falso.falharLeitura = true } })
  const secao = await abrirResponsaveis()
  const alerta = await secao.findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar os responsáveis. Verifique a conexão e tente de novo.')
  processos.falharLeitura = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await linhasDa(secao)).toHaveLength(2)
})

test('Novo responsável grava sem espaços, com e-mail em minúsculas, e fecha o formulário', async () => {
  const processos = montar({ responsaveis: [] })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Novo responsável' }))
  preencher(secao, { nome: '  Carla Teste ', email: ' Carla.Teste@Exemplo.com ', cargo: '' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect(await linhasDa(secao)).toEqual([expect.stringContaining('Carla Testecarla.teste@exemplo.com—')])
  expect(processos.responsaveisDoSetor.s1).toEqual([{ id: 'r1', nome: 'Carla Teste', email: 'carla.teste@exemplo.com', cargo: null }])
  expect(secao.queryByRole('form', { name: 'Novo responsável' })).toBeNull()
})

test('nome em branco e e-mail mal formado são recusados na tela, sem gravar', async () => {
  const processos = montar({ responsaveis: [] })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Novo responsável' }))
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('O nome do responsável é obrigatório.')
  preencher(secao, { nome: 'Carla Teste', email: 'carla@' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('O e-mail deve ter o formato nome@dominio. Recebido: "carla@".')
  expect(processos.responsaveisDoSetor.s1).toEqual([])
})

test.each([
  ['falha genérica', 'sem conexão', 'A alteração não foi salva: sem conexão. Seus dados continuam no formulário.'],
  ['recusa do banco', new TravaDoBanco('O e-mail deve ter o formato nome@dominio. Recebido: "x@y".'),
    'O e-mail deve ter o formato nome@dominio. Recebido: "x@y".'],
])('%s ao criar mantém o formulário com os dados', async (_caso, falha, texto) => {
  montar({ responsaveis: [], ajustar: (processos) => { processos.falhaDeGravacao = falha } })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Novo responsável' }))
  preencher(secao, { nome: 'Carla Teste', email: 'carla.teste@exemplo.com' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe(texto)
  expect((secao.getByLabelText('Nome') as HTMLInputElement).value).toBe('Carla Teste')
})

test('Editar abre o formulário preenchido e grava a mudança', async () => {
  montar()
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Bruno Teste' }))
  const formulario = within(secao.getByRole('form', { name: 'Editar responsável' }))
  expect((formulario.getByLabelText('E-mail') as HTMLInputElement).value).toBe('bruno.teste@exemplo.com')
  preencher(secao, { cargo: 'Diretor de Teste' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await linhasDa(secao))[1]).toContain('Diretor de Teste')
})

test('falha ao editar mantém o formulário com os dados', async () => {
  montar({ ajustar: (processos) => { processos.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Bruno Teste' }))
  preencher(secao, { cargo: 'Diretor de Teste' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toContain('Seus dados continuam no formulário.')
  expect((secao.getByLabelText('Cargo') as HTMLInputElement).value).toBe('Diretor de Teste')
})

test('Excluir pede confirmação com o texto da spec e, confirmado, tira o responsável', async () => {
  const processos = montar()
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Bruno Teste' }))
  expect(janelaAberta().getByRole('heading').textContent).toBe('Excluir o responsável Bruno Teste?')
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir responsável' }))
  await waitFor(async () => expect(await linhasDa(secao)).toHaveLength(1))
  expect(processos.responsaveisDoSetor.s1.map((responsavel) => responsavel.nome)).toEqual(['Ana Teste'])
})

test('Cancelar e Esc fecham a janela de Excluir sem gravar', async () => {
  const processos = montar()
  const secao = await abrirResponsaveis()
  const excluir = await secao.findByRole('button', { name: 'Excluir Bruno Teste' })
  fireEvent.click(excluir)
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(excluir)
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(processos.responsaveisDoSetor.s1).toHaveLength(2)
})

test('falha ao excluir mostra o motivo e mantém o responsável', async () => {
  montar({ ajustar: (processos) => { processos.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Bruno Teste' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir responsável' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(await linhasDa(secao)).toHaveLength(2)
})

test('a Consulta vê nome, e-mail e cargo, sem botões', async () => {
  montar({ perfil: 'consulta' })
  const secao = await abrirResponsaveis()
  expect(await linhasDa(secao)).toEqual([
    'Ana Teste——', 'Bruno Testebruno.teste@exemplo.comChefe de Teste',
  ])
  expect(secao.queryAllByRole('button')).toHaveLength(0)
})
