import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido, TipoDeProcesso } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

type Item = { id: string; nome: string; tipo: TipoDeProcesso; macro: 'm1' | 'm2'; pai?: string | null }

function processo({ id, nome, tipo, macro, pai = null }: Item): ProcessoLido {
  return {
    id, nome, tipo, setorId: 's1', setorSigla: 'TSA', macroprocessoId: macro,
    macroprocessoNome: macro === 'm1' ? 'Macro A' : 'Macro B', processoPaiId: pai, situacao: 'em_andamento',
    etapaAtual: null, aguardandoOSetor: false, responsavel: null, origem: 'novo', contexto: null, observacoes: null,
    motivoDaSituacao: null, processoPai: null, subprocessos: [], dataDaReuniao: null, etapasDoSetor: [], etapasDoProcesso: [],
  }
}

// p1 tem o subprocesso p3; p2 está "a classificar"; p4 é um processo sem filhos em outro macroprocesso.
const PROCESSOS = [
  processo({ id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', macro: 'm1' }),
  processo({ id: 'p2', nome: 'Solto', tipo: 'a_classificar', macro: 'm2' }),
  processo({ id: 'p3', nome: 'Conferir Ofício', tipo: 'subprocesso', macro: 'm1', pai: 'p1' }),
  processo({ id: 'p4', nome: 'Arquivar', tipo: 'processo', macro: 'm2' }),
]

type Montagem = { id: string; perfil?: Perfil; ajustar?: (falso: ProcessosFalso) => void }

function montar({ id, perfil = 'integrante_ep', ajustar }: Montagem) {
  window.location.hash = `#/processos/${id}`
  const falso = new ProcessosFalso()
  falso.processos = PROCESSOS.map((item) => ({ ...item }))
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
const opcoes = (seletor: HTMLElement) => Array.from((seletor as HTMLSelectElement).options).map((opcao) => opcao.textContent)
// O cabeçalho do painel: título, macroprocesso e as pílulas de tipo e situação.
const cabecalho = (aberto: ReturnType<typeof within>) => within(aberto.getByRole('heading', { level: 2 }).closest('header') as HTMLElement)
const escrever = (campo: HTMLElement, valor: string) => fireEvent.change(campo, { target: { value: valor } })

async function abrirJanela(nome: string) {
  fireEvent.click(await (await painel()).findByRole('button', { name: 'Reclassificar' }))
  return within(screen.getByRole('dialog', { name: `Reclassificar o processo ${nome}?` }))
}

async function escolherPai(janela: ReturnType<typeof within>, pai: string) {
  await waitFor(() => expect(janela.getByLabelText('Processo pai').querySelectorAll('option').length).toBeGreaterThan(1))
  escrever(janela.getByLabelText('Processo pai'), pai)
}

function confirmar(janela: ReturnType<typeof within>, motivo: string) {
  escrever(janela.getByLabelText('Motivo'), motivo)
  fireEvent.click(janela.getByRole('button', { name: 'Reclassificar' }))
}

test('Consulta não vê [Reclassificar]', async () => {
  montar({ id: 'p2', perfil: 'consulta' })
  const aberto = await painel()
  await aberto.findByText('Dados do processo')
  expect(aberto.queryByRole('button', { name: 'Reclassificar' })).toBeNull()
})

test.each([
  ['p2', 'Solto', ['Processo', 'Subprocesso']],
  ['p4', 'Arquivar', ['Subprocesso']],
  ['p3', 'Conferir Ofício', ['Processo']],
])('o novo tipo de %s oferece só os destinos permitidos', async (id, nome, destinos) => {
  montar({ id })
  expect(opcoes((await abrirJanela(nome)).getByLabelText('Novo tipo'))).toEqual(destinos)
})

test('o pai se escolhe entre os processos do tipo Processo, sem o próprio item', async () => {
  montar({ id: 'p4' })
  const janela = await abrirJanela('Arquivar')
  await waitFor(() => expect(opcoes(janela.getByLabelText('Processo pai'))).toEqual(['Escolha o processo pai', 'TSA — Emitir Ofício']))
})

test('o botão fica desabilitado sem pai ou sem motivo, e Esc fecha sem gravar', async () => {
  const falso = montar({ id: 'p4' })
  const janela = await abrirJanela('Arquivar')
  const botao = janela.getByRole('button', { name: 'Reclassificar' }) as HTMLButtonElement
  escrever(janela.getByLabelText('Motivo'), 'Faz parte do Emitir Ofício')
  expect(botao.disabled).toBe(true)
  await escolherPai(janela, 'p1')
  expect(botao.disabled).toBe(false)
  escrever(janela.getByLabelText('Motivo'), '   ')
  expect(botao.disabled).toBe(true)
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(falso.processos[3].tipo).toBe('processo')
})

test('o aviso de macroprocesso aparece só quando o macroprocesso muda', async () => {
  montar({ id: 'p2' })
  const janela = await abrirJanela('Solto')
  escrever(janela.getByLabelText('Novo tipo'), 'subprocesso')
  await escolherPai(janela, 'p4')
  expect(janela.queryByText(/O item passa do macroprocesso/)).toBeNull()
  escrever(janela.getByLabelText('Processo pai'), 'p1')
  expect(janela.getByText('O item passa do macroprocesso Macro B para Macro A, o do processo pai.')).toBeTruthy()
})

test('"a classificar" vira processo: a pílula do tipo muda no painel', async () => {
  const falso = montar({ id: 'p2' })
  confirmar(await abrirJanela('Solto'), 'É um processo')
  await waitFor(() => expect(falso.processos[1].tipo).toBe('processo'))
  const aberto = await painel()
  await waitFor(() => expect(cabecalho(aberto).getByText('Processo')).toBeTruthy())
})

test('processo vira subprocesso: passa ao macroprocesso do pai e o painel mostra o pai', async () => {
  const falso = montar({ id: 'p4' })
  const janela = await abrirJanela('Arquivar')
  await escolherPai(janela, 'p1')
  confirmar(janela, 'Faz parte do Emitir Ofício')
  await waitFor(() => expect(falso.processos[3]).toMatchObject({ tipo: 'subprocesso', processoPaiId: 'p1', macroprocessoId: 'm1' }))
  const aberto = await painel()
  expect(await aberto.findByRole('link', { name: 'Emitir Ofício' })).toBeTruthy()
  expect(cabecalho(aberto).getByText('Macro A')).toBeTruthy()
})

test('subprocesso vira processo: o pai some do painel', async () => {
  const falso = montar({ id: 'p3' })
  const aberto = await painel()
  expect(await aberto.findByRole('link', { name: 'Emitir Ofício' })).toBeTruthy()
  confirmar(await abrirJanela('Conferir Ofício'), 'Virou processo')
  await waitFor(() => expect(falso.processos[2]).toMatchObject({ tipo: 'processo', processoPaiId: null }))
  await waitFor(() => expect(aberto.queryByRole('link', { name: 'Emitir Ofício' })).toBeNull())
})

test('processo com subprocessos não vira subprocesso: a recusa com a contagem', async () => {
  const falso = montar({ id: 'p1' })
  const janela = await abrirJanela('Emitir Ofício')
  await escolherPai(janela, 'p4')
  confirmar(janela, 'Tentativa')
  expect((await (await painel()).findByRole('alert')).textContent)
    .toBe('Este processo tem 1 subprocessos; reclassifique-os ou exclua-os antes.')
  expect(falso.processos[0].tipo).toBe('processo')
})

test.each([
  [new TravaDoBanco('O processo pai precisa ser do tipo Processo.'), 'O processo pai precisa ser do tipo Processo.'],
  ['sem conexão', 'A alteração não foi salva: sem conexão.'],
])('falha ao reclassificar aparece como alerta, sem mudar o tipo (%s)', async (falha, texto) => {
  const falso = montar({ id: 'p2', ajustar: (f) => { f.falhaDeGravacao = falha } })
  confirmar(await abrirJanela('Solto'), 'É um processo')
  expect((await (await painel()).findByRole('alert')).textContent).toBe(texto)
  expect(falso.processos[1].tipo).toBe('a_classificar')
})

test('o histórico mostra "Reclassificou" com o tipo de e para, o pai e o motivo', async () => {
  const evento: EventoDoCadastro = {
    id: 1, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao: 'reclassificar', entidade: 'processo',
    entidadeRef: 'p3', antes: { tipo: 'a_classificar' }, depois: { tipo: 'subprocesso', processo_pai_nome: 'Emitir Ofício' },
    motivo: 'Faz parte do Emitir Ofício',
  }
  montar({ id: 'p3', ajustar: (f) => { f.historicoDosProcessos = { p3: [evento] } } })
  fireEvent.click(await (await painel()).findByRole('tab', { name: 'Histórico' }))
  const aberto = await painel()
  for (const texto of ['Reclassificou', 'Tipo: A classificar', 'Tipo: Subprocesso; Processo pai: Emitir Ofício', 'Motivo: Faz parte do Emitir Ofício']) {
    expect(await aberto.findByText(texto, { exact: false })).toBeTruthy()
  }
})
