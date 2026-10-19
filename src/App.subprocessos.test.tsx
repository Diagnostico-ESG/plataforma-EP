import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido, TipoDeProcesso } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/novo'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

type Item = { id: string; nome: string; tipo: TipoDeProcesso; macro?: string; pai?: string | null }

function processo({ id, nome, tipo, macro = 'm1', pai = null }: Item): ProcessoLido {
  return {
    id, nome, tipo, setorId: 's1', setorSigla: 'TSA', macroprocessoId: macro,
    macroprocessoNome: macro === 'm1' ? 'Macro A' : 'Macro B', processoPaiId: pai, situacao: 'em_andamento',
    etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, processoPai: null,
    subprocessos: [], dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: [],
  }
}

// O pai em Macro A; um "a classificar" e um subprocesso, que não servem de pai.
const PROCESSOS = [
  processo({ id: 'p1', nome: 'Emitir Ofício', tipo: 'processo' }),
  processo({ id: 'p2', nome: 'Solto', tipo: 'a_classificar', macro: 'm2' }),
  processo({ id: 'p3', nome: 'Conferir Ofício', tipo: 'subprocesso', pai: 'p1' }),
]

function montar(perfil: Perfil = 'integrante_ep') {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true },
  ]
  const comum = { codigo: null, descricao: null, categoria: null, ativo: true }
  cadastros.macroprocessos = [{ id: 'm1', nome: 'Macro A', ...comum }, { id: 'm2', nome: 'Macro B', ...comum }]
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [{ id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }]
  falso.siglasDosSetores = { s1: 'TSA', s2: 'TSB' }
  falso.nomesDosMacroprocessos = { m1: 'Macro A', m2: 'Macro B' }
  falso.processos = PROCESSOS.map((item) => ({ ...item }))
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}

const opcoes = (seletor: HTMLElement) => Array.from((seletor as HTMLSelectElement).options).map((opcao) => opcao.textContent)
const escrever = (campo: HTMLElement, valor: string) => fireEvent.change(campo, { target: { value: valor } })

async function formulario(nome = 'Cadastrar processo') {
  const form = within(await screen.findByRole('form', { name: nome }))
  await waitFor(() => expect(form.getByLabelText('Setor').querySelectorAll('option').length).toBeGreaterThan(1))
  return form
}

async function escolherSubprocesso() {
  const form = await formulario()
  escrever(form.getByLabelText('Tipo'), 'subprocesso')
  await waitFor(() => expect(form.getByLabelText('Processo pai').querySelectorAll('option').length).toBeGreaterThan(1))
  return form
}

test('o tipo oferece Processo, Subprocesso e A classificar; o pai só aparece no Subprocesso', async () => {
  montar()
  const form = await formulario()
  expect(opcoes(form.getByLabelText('Tipo'))).toEqual(['Processo', 'Subprocesso', 'A classificar'])
  expect(form.queryByLabelText('Processo pai')).toBeNull()
  escrever(form.getByLabelText('Tipo'), 'subprocesso')
  expect(await form.findByLabelText('Processo pai')).toBeTruthy()
})

test('o pai se escolhe só entre os processos do tipo Processo', async () => {
  montar()
  const form = await escolherSubprocesso()
  expect(opcoes(form.getByLabelText('Processo pai'))).toEqual(['Escolha o processo pai', 'TSA — Emitir Ofício'])
})

test('escolher o pai fixa o macroprocesso no dele', async () => {
  montar()
  const form = await escolherSubprocesso()
  const macro = form.getByLabelText('Macroprocesso') as HTMLSelectElement
  expect(macro.disabled).toBe(true)
  escrever(form.getByLabelText('Processo pai'), 'p1')
  expect(macro.value).toBe('m1')
})

test('subprocesso sem pai é recusado antes de enviar', async () => {
  const falso = montar()
  const form = await escolherSubprocesso()
  escrever(form.getByLabelText('Nome'), 'Arquivar Ofício')
  escrever(form.getByLabelText('Setor'), 's2')
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))
  expect((await form.findByRole('alert')).textContent).toBe('Escolha o processo pai.')
  expect(falso.processos).toHaveLength(3)
})

test('cadastrar o subprocesso grava o pai e o macroprocesso dele, e o cartão traz a pílula "Subprocesso"', async () => {
  const falso = montar()
  const form = await escolherSubprocesso()
  escrever(form.getByLabelText('Nome'), 'Arquivar Ofício')
  escrever(form.getByLabelText('Setor'), 's2')
  escrever(form.getByLabelText('Processo pai'), 'p1')
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(falso.processos.at(-1)).toMatchObject({
    nome: 'Arquivar Ofício', setorId: 's2', tipo: 'subprocesso', processoPaiId: 'p1', macroprocessoId: 'm1' })
  const cartao = await screen.findByRole('link', { name: /Arquivar Ofício/ })
  expect(within(cartao).getByText('Subprocesso')).toBeTruthy()
})

test('falha ao gravar o subprocesso: a frase em vermelho e os dados continuam no formulário', async () => {
  const falso = montar()
  falso.falhaDeGravacao = 'sem conexão'
  const form = await escolherSubprocesso()
  escrever(form.getByLabelText('Nome'), 'Arquivar Ofício')
  escrever(form.getByLabelText('Setor'), 's2')
  escrever(form.getByLabelText('Processo pai'), 'p1')
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))
  expect((await form.findByRole('alert')).textContent).toBe(
    'A alteração não foi salva: sem conexão. Seus dados continuam no formulário.')
  expect((form.getByLabelText('Processo pai') as HTMLSelectElement).value).toBe('p1')
})

test('a edição do subprocesso não mostra o tipo nem o pai, e o macroprocesso fica fixo', async () => {
  window.location.hash = '#/processos/p3'
  montar()
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  fireEvent.click(await painel.findByRole('button', { name: 'Editar' }))
  const form = await formulario('Editar processo')
  expect(form.queryByLabelText('Tipo')).toBeNull()
  expect(form.queryByLabelText('Processo pai')).toBeNull()
  expect((form.getByLabelText('Macroprocesso') as HTMLSelectElement).disabled).toBe(true)
})

const painelDoProcesso = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))

test('o painel do pai lista os subprocessos, e cada um abre o seu painel, com o link de volta ao pai', async () => {
  window.location.hash = '#/processos/p1'
  montar()
  const subprocessos = within(await (await painelDoProcesso()).findByRole('region', { name: 'Subprocessos' }))
  fireEvent.click(subprocessos.getByRole('link', { name: 'Conferir Ofício' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p3'))
  const pai = within(await (await painelDoProcesso()).findByRole('region', { name: 'Processo pai' }))
  expect(pai.getByRole('link', { name: 'Emitir Ofício' }).getAttribute('href')).toBe('#/processos/p1')
})

test('processo sem pai e sem subprocessos não mostra a seção', async () => {
  window.location.hash = '#/processos/p2'
  montar()
  const aberto = await painelDoProcesso()
  await aberto.findByText('Dados do processo')
  expect(aberto.queryByRole('region', { name: 'Subprocessos' })).toBeNull()
  expect(aberto.queryByRole('region', { name: 'Processo pai' })).toBeNull()
})

test('a Consulta também vê os subprocessos', async () => {
  window.location.hash = '#/processos/p1'
  montar('consulta')
  expect(await (await painelDoProcesso()).findByRole('region', { name: 'Subprocessos' })).toBeTruthy()
})

test('excluir o processo com subprocessos é recusado com a contagem', async () => {
  window.location.hash = '#/processos/p1'
  const falso = montar()
  fireEvent.click(await (await painelDoProcesso()).findByRole('button', { name: 'Excluir' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir processo' }))
  expect((await (await painelDoProcesso()).findByRole('alert')).textContent)
    .toBe('Este processo tem 1 subprocessos; reclassifique-os ou exclua-os antes.')
  expect(falso.processos).toHaveLength(3)
})
