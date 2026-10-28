import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { corDoSetor } from './cadastros/corDoSetor'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { umSetor } from './testes/processoDaLista'
import { montarVerso, processoLido } from './testes/processoNoVerso'
import { versoAberto } from './testes/versoDoCartao'
import { cartaoDe, dia, montar, processo } from './testes/quadroDeTeste'
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

test('no agrupamento por setor, a sigla do título leva o selo da cor, e a coluna inativa mantém a marca e a cor', async () => {
  const ativo = umSetor('s1', 'TSA', 'Setor de Testes A', true, 13)
  const inativo = umSetor('s3', 'MNO', 'Setor Antigo', false, 22)
  montar([processo('Processo Antigo', { processo: { setorId: 's3', setorSigla: 'MNO', setorCor: 22 } })], 'integrante_ep', [], new VersoesFalso(), [ativo, inativo])
  fireEvent.click(await screen.findByRole('button', { name: 'Setor' }))
  const coluna = within(await screen.findByRole('region', { name: 'MNO · Setor Antigo · inativo' }))
  const seloDe = (sigla: string) => Array.from(document.querySelectorAll<HTMLElement>('.coluna-titulo .selo-do-setor')).find((el) => el.textContent === sigla)
  expect(seloDe('TSA')?.style.getPropertyValue('--cor-claro')).toBe(corDoSetor(13).claro)
  expect(seloDe('MNO')?.style.getPropertyValue('--cor-claro')).toBe(corDoSetor(22).claro)
  expect(coluna.getByText('Inativo')).toBeTruthy()
  expect(coluna.getByText('Setor Antigo')).toBeTruthy()
})

const faixaDe = (cartao: HTMLElement) => cartao.querySelector('.cartao-faixa') as HTMLElement

test('por etapa, a faixa traz a sigla na cor do setor e o nome do processo segue no corpo', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const cartao = await cartaoDe('Emitir Ofício')
  expect(faixaDe(cartao).textContent).toBe('TSA')
  expect(faixaDe(cartao).style.getPropertyValue('--cor-claro')).toBe(corDoSetor(13).claro)
  expect(cartao.querySelector('.cartao-nome')?.textContent).toBe('Emitir Ofício')
})

test('por responsável a faixa também traz a sigla', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  fireEvent.click(await screen.findByRole('button', { name: 'Responsável' }))
  expect(faixaDe(await cartaoDe('Emitir Ofício')).textContent).toBe('TSA')
})

test('por setor a faixa traz o nome do processo e o corpo não o repete', async () => {
  const setor = umSetor('s1', 'TSA', 'Setor A', true, 13)
  montar([processo('Emitir Ofício', { processo: { setorId: 's1', setorSigla: 'TSA', setorCor: 13 } })], 'integrante_ep', [], new VersoesFalso(), [setor])
  fireEvent.click(await screen.findByRole('button', { name: 'Setor' }))
  const cartao = await screen.findByRole('link', { name: /Emitir Ofício/ })
  expect(faixaDe(cartao).textContent).toBe('Emitir Ofício')
  expect(faixaDe(cartao).style.getPropertyValue('--cor-claro')).toBe(corDoSetor(13).claro)
  expect(cartao.querySelector('.cartao-nome')).toBeNull()
  expect(within(cartao).getAllByText('Emitir Ofício')).toHaveLength(1)
})

test('o processo de setor inativo mantém a cor na faixa, e o parado continua com a marca de parado', async () => {
  montar([processo('Processo Parado', { processo: { setorSigla: 'MNO', setorCor: 22, entrouNaEtapaEm: dia(-30) } })])
  const cartao = await cartaoDe('Processo Parado')
  expect(faixaDe(cartao).style.getPropertyValue('--cor-claro')).toBe(corDoSetor(22).claro)
  expect(cartao.className).toContain('cartao-parado')
})

test('o cabeçalho do verso mostra o selo do setor; a seção Sobre continua com o setor em texto', async () => {
  montarVerso(processoLido({ setorSigla: 'TSA', setorCor: 13 }))
  await versoAberto()
  // Um só selo no verso inteiro (o Quadro atrás tem os seus): o do cabeçalho. A seção Sobre fica com o setor em texto.
  const selos = (document.querySelector('dialog.verso') as HTMLElement).querySelectorAll<HTMLElement>('.selo-do-setor')
  expect(selos).toHaveLength(1)
  expect(selos[0].closest('.verso-cabecalho')).not.toBeNull()
  expect(selos[0].textContent).toBe('TSA')
  expect(selos[0].style.getPropertyValue('--cor-claro')).toBe(corDoSetor(13).claro)
})

test('a coluna Setor da Lista mostra o selo da cor, e o nome da célula segue sendo a sigla', async () => {
  window.location.hash = '#/processos/lista'
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const celula = await screen.findByRole('cell', { name: 'TSA' })
  const selo = celula.querySelector('.selo-do-setor') as HTMLElement
  expect(selo.textContent).toBe('TSA')
  expect(selo.style.getPropertyValue('--cor-claro')).toBe(corDoSetor(13).claro)
})
