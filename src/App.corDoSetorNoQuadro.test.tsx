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
import { montarNosCadastros } from './testes/processosNosCadastros'
import { versoAberto } from './testes/versoDoCartao'
import { abrirFiltros } from './testes/filtrosDoQuadro'
import { escolherFormaDeVer } from './testes/formaDeVer'
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
  (opcao?.querySelector('.opcao-cor-do-setor') as HTMLElement | null)?.style.getPropertyValue('--cor-do-setor')

test('o filtro Setor mostra o quadradinho da cor do setor, sem a cor no nome da opção', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const opcao = within(within(await abrirFiltros()).getByLabelText('Setor')).getByRole('option', { name: 'TSA' })
  expect(corClaraDaMarca(opcao)).toBe(corDoSetor(13).hex)
})

test('o filtro Macroprocesso não leva quadradinho de cor: só o setor tem cor', async () => {
  montar([processo('Emitir Ofício', { processo: { macroprocessoId: 'm1', macroprocessoNome: 'Macro Um' } })])
  const opcao = within(within(await abrirFiltros()).getByLabelText('Macroprocesso')).getByRole('option', { name: 'Macro Um' })
  expect(opcao.querySelector('.opcao-marca')).toBeNull()
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
  expect(corClaraDaMarca(within(campo).getByRole('option', { name: 'TSA — Setor Teste A' }))).toBe(corDoSetor(13).hex)
  expect(corClaraDaMarca(within(campo).getByRole('option', { name: 'TSB — Setor Teste B' }))).toBe(corDoSetor(22).hex)
})

test('no agrupamento por setor, a coluna não leva cor de setor, e a coluna inativa traz a marca Inativo', async () => {
  const ativo = umSetor('s1', 'TSA', 'Setor de Testes A', true, 13)
  const inativo = umSetor('s3', 'MNO', 'Setor Antigo', false, 22)
  montar([processo('Processo Antigo', { processo: { setorId: 's3', setorSigla: 'MNO', setorCor: 22 } })], 'integrante_ep', [], new VersoesFalso(), [ativo, inativo])
  await escolherFormaDeVer('Quadro por setor')
  const regiao = await screen.findByRole('region', { name: 'MNO · Setor Antigo · inativo' })
  const coluna = within(regiao)
  const colunaAtiva = screen.getByRole('region', { name: /^TSA ·/ })
  expect(colunaAtiva.style.getPropertyValue('--cor-do-setor')).toBe('')
  expect(regiao.style.getPropertyValue('--cor-do-setor')).toBe('')
  expect(coluna.getByText('Inativo')).toBeTruthy()
  expect(coluna.getByText('Setor Antigo')).toBeTruthy()
  expect(document.querySelector('.coluna-titulo .selo-do-setor')).toBeNull()
})

const faixaDe = (cartao: HTMLElement) => cartao.querySelector('.selo-do-setor') as HTMLElement

test('por etapa, o selo traz a sigla na cor do setor e o nome do processo segue no corpo', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const cartao = await cartaoDe('Emitir Ofício')
  expect(faixaDe(cartao).textContent).toBe('TSA')
  expect(faixaDe(cartao).style.getPropertyValue('--cor-do-setor')).toBe(corDoSetor(13).hex)
  expect(cartao.querySelector('.cartao-nome')?.textContent).toBe('Emitir Ofício')
})

test('por responsável o selo também traz a sigla', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  await escolherFormaDeVer('Quadro por responsável')
  expect(faixaDe(await cartaoDe('Emitir Ofício')).textContent).toBe('TSA')
})

test('por setor o cartão não leva selo: o nome do processo fica no corpo, como por etapa', async () => {
  const setor = umSetor('s1', 'TSA', 'Setor A', true, 13)
  montar([processo('Emitir Ofício', { processo: { setorId: 's1', setorSigla: 'TSA', setorCor: 13 } })], 'integrante_ep', [], new VersoesFalso(), [setor])
  await escolherFormaDeVer('Quadro por setor')
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.querySelector('.selo-do-setor')).toBeNull()
  expect(cartao.querySelector('.cartao-nome')?.textContent).toBe('Emitir Ofício')
  expect(within(cartao).getAllByText('Emitir Ofício')).toHaveLength(1)
})

test('por setor o cabeçalho da coluna traz a sigla e o nome do setor, e a coluna vazia mantém a frase', async () => {
  const setor = umSetor('s1', 'TSA', 'Setor A', true, 13)
  const outro = umSetor('s2', 'TSB', 'Setor B', true, 22)
  montar([processo('Emitir Ofício', { processo: { setorId: 's2', setorSigla: 'TSB', setorCor: 22 } })], 'integrante_ep', [], new VersoesFalso(), [setor, outro])
  await escolherFormaDeVer('Quadro por setor')
  const regiao = await screen.findByRole('region', { name: 'TSA · Setor A' })
  expect(regiao.style.getPropertyValue('--cor-do-setor')).toBe('')
  expect(regiao.querySelector('.coluna-titulo-principal')?.textContent).toBe('TSA')
  expect(regiao.querySelector('.coluna-titulo-nome')?.textContent).toBe('Setor A')
  expect(within(regiao).getByText('Nenhum processo deste setor no Quadro.')).toBeTruthy()
})

test('o processo de setor inativo mantém a cor no selo, e o parado continua com a marca de parado', async () => {
  montar([processo('Processo Parado', { processo: { setorSigla: 'MNO', setorCor: 22, entrouNaEtapaEm: dia(-30) } })])
  const cartao = await cartaoDe('Processo Parado')
  expect(faixaDe(cartao).style.getPropertyValue('--cor-do-setor')).toBe(corDoSetor(22).hex)
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
  expect(selos[0].style.getPropertyValue('--cor-do-setor')).toBe(corDoSetor(13).hex)
})

test('a coluna Setor da Lista mostra o selo da cor, e o nome da célula segue sendo a sigla', async () => {
  window.location.hash = '#/processos/lista'
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const celula = await screen.findByRole('cell', { name: 'TSA' })
  const selo = celula.querySelector('.selo-do-setor') as HTMLElement
  expect(selo.textContent).toBe('TSA')
  expect(selo.style.getPropertyValue('--cor-do-setor')).toBe(corDoSetor(13).hex)
})

test('trocar a cor do setor no cadastro muda o selo do cartão na próxima vez que o Quadro carrega', async () => {
  window.location.hash = '#/setores'
  montarNosCadastros()
  fireEvent.click(await screen.findByRole('button', { name: 'TSA' }))
  const grade = within(await screen.findByRole('group', { name: 'Cor do setor' }))
  fireEvent.click(grade.getByRole('radio', { name: 'laranja' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('button', { name: 'TSB' })
  window.location.hash = '#/processos'
  const cartao = await cartaoDe('Emitir Ofício')
  expect((cartao.querySelector('.selo-do-setor') as HTMLElement).style.getPropertyValue('--cor-do-setor')).toBe(corDoSetor(2).hex)
})
