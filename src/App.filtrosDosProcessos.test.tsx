import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { botaoDaColuna, escolherNaColuna, nomesNasLinhas, opcoesDaColuna } from './testes/cabecalhoDaLista'
import { abrirFiltros, botaoDosFiltros, escolherNoQuadro } from './testes/filtrosDoQuadro'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  window.location.hash = '#/processos/lista'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM: EtapaDoCatalogo = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }
const RELATORIO: EtapaDoCatalogo = { id: 'e5', codigo: 'relatorio', nome: 'Relatório técnico', ordem: 5, ativa: true }
const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    situacao: 'em_andamento', etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem, id: 'e', posicao: 1, total: 1 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null,
    motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária'),
  processo('p2', 'Conferir Recibo', { tipo: 'subprocesso', processoPaiId: 'p1', responsavel: ANA }),
  processo('p3', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB', situacao: 'concluido', etapaAtual: null }),
  processo('p4', 'Arquivar Pasta', {
    setorId: 's2', setorSigla: 'TSB', macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois',
    etapaAtual: { codigo: RELATORIO.codigo, nome: RELATORIO.nome, ordem: RELATORIO.ordem, id: 'e', posicao: 1, total: 1 }, tipo: 'a_classificar',
  }),
  processo('p5', 'Cadastrar Bem', { responsavel: ANA }),
]

type Montagem = { perfil?: Perfil }

function montar({ perfil = 'integrante_ep' }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM, RELATORIO]
  falso.processos = PROCESSOS
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
}

const nomesNaLista = nomesNasLinhas
// Na Lista, os filtros ficam no cabeçalho de cada coluna (ticket 04 de repositorio-de-processos).
const escolher = escolherNaColuna

const painel = () => screen.queryByRole('dialog', { name: 'Filtros' })

test('Quadro sem filtro: o botão Filtros sem contador e sem destaque, e os filtros fora da tela', async () => {
  window.location.hash = '#/processos'
  montar()
  const botao = await botaoDosFiltros()
  expect(botao.getAttribute('aria-label')).toBe('Filtros')
  expect(botao.querySelector('.faixa-contador:not(.faixa-contador-vazio)')).toBeNull()
  expect(botao.classList.contains('botao-ligado')).toBe(false)
  expect(screen.queryByRole('group', { name: 'Filtros dos processos' })).toBeNull()
})

test('o painel tem os cinco filtros, aplica ao escolher e o botão conta os ligados', async () => {
  window.location.hash = '#/processos'
  montar()
  const aberto = await abrirFiltros()
  const rotulos = within(aberto).getAllByRole('combobox').map((seletor) => seletor.getAttribute('id') && aberto.querySelector(`label[for="${seletor.id}"]`)?.textContent)
  expect(rotulos).toEqual(['Setor', 'Macroprocesso', 'Etapa atual', 'Tipo', 'Responsável'])
  await escolherNoQuadro('Setor', 'TSB')
  await waitFor(() => expect(window.location.hash).toBe('#/processos?setor=s2'))
  await waitFor(() => expect(screen.queryByRole('link', { name: /Pagar Diária/ })).toBeNull())
  const botao = await botaoDosFiltros()
  expect(botao.getAttribute('aria-label')).toBe('Filtros, 1 ligado')
  expect(botao.querySelector('.faixa-contador')?.textContent).toBe('1')
  expect(botao.classList.contains('botao-ligado')).toBe(true)
})

test('Esc com o foco num seletor fecha o painel e devolve o foco ao botão', async () => {
  window.location.hash = '#/processos'
  montar()
  const seletor = within(await abrirFiltros()).getByLabelText('Tipo')
  seletor.focus()
  fireEvent.keyDown(seletor, { key: 'Escape' })
  expect(painel()).toBeNull()
  expect(document.activeElement).toBe(await botaoDosFiltros())
})

test('o painel fecha com clique fora e com um segundo clique no botão', async () => {
  window.location.hash = '#/processos'
  montar()
  await abrirFiltros()
  fireEvent.pointerDown(document.body)
  expect(painel()).toBeNull()
  await abrirFiltros()
  fireEvent.click(await botaoDosFiltros())
  expect(painel()).toBeNull()
  expect((await botaoDosFiltros()).getAttribute('aria-expanded')).toBe('false')
})

test('Limpar filtros no painel zera os filtros', async () => {
  window.location.hash = '#/processos?setor=s2&tipo=processo'
  montar()
  fireEvent.click(within(await abrirFiltros()).getByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect((await botaoDosFiltros()).getAttribute('aria-label')).toBe('Filtros')
})

test.each(['responsavel', 'setor'])('os filtros e o contador valem do mesmo jeito no Quadro por %s', async (agrupar) => {
  window.location.hash = `#/processos?tipo=processo&agrupar=${agrupar}`
  montar()
  expect((await botaoDosFiltros()).getAttribute('aria-label')).toBe('Filtros, 1 ligado')
  expect((within(await abrirFiltros()).getByLabelText('Tipo') as HTMLSelectElement).value).toBe('processo')
})

test('o filtro de Setor troca as linhas da Lista e vai para o endereço', async () => {
  montar()
  await escolher('Setor', 'TSB')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?setor=s2'))
  expect(await nomesNaLista()).toEqual(['Arquivar Pasta', 'Emitir Ofício'])
})

// Um teste por filtro: um teste só com todos os casos estourava o tempo sob carga e, ao estourar, deixava o
// endereço do caso seguinte (como responsavel=u1) vazar para o teste que vinha depois.
const CASOS: [string, string, string[]][] = [
  ['Macroprocesso', 'Macro Dois', ['Arquivar Pasta']],
  ['Etapa atual', 'Relatório técnico', ['Arquivar Pasta']],
  ['Tipo', 'Subprocesso', ['Conferir Recibo']],
  ['Responsável', 'Ana Teste', ['Cadastrar Bem', 'Conferir Recibo']],
  ['Situação', 'Concluído', ['Emitir Ofício']],
]

test.each(CASOS)('o filtro %s = %s troca as linhas da Lista', async (rotulo, opcao, esperado) => {
  montar()
  await escolher(rotulo, opcao)
  await waitFor(async () => expect(await nomesNaLista()).toEqual(esperado))
})

test('as opções de etapa não têm "Aguardando o setor", e o endereço antigo com ele mostra tudo', async () => {
  window.location.hash = '#/processos/lista?etapa=aguardando-o-setor'
  montar()
  expect(await nomesNaLista()).toHaveLength(PROCESSOS.length)
  expect(await opcoesDaColuna('Etapa atual')).not.toContain('Aguardando o setor')
  expect(screen.queryByText('Nenhum processo com estes filtros.')).toBeNull()
})

test('a combinação de filtros é "e", e o endereço guarda os dois', async () => {
  montar()
  await escolher('Setor', 'TSA')
  await escolher('Tipo', 'Subprocesso')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?setor=s1&tipo=subprocesso'))
  expect(await nomesNaLista()).toEqual(['Conferir Recibo'])
})

test('recarregar com filtros no endereço: a mesma visão e os cabeçalhos marcados', async () => {
  window.location.hash = '#/processos/lista?setor=s2&situacao=concluido'
  montar()
  expect(await nomesNaLista()).toEqual(['Emitir Ofício'])
  expect((await botaoDaColuna('Setor')).textContent).toMatch(/filtrado: TSB/)
  expect((await botaoDaColuna('Situação')).textContent).toMatch(/filtrado: Concluído/)
})

test('Quadro: os filtros sem Situação; o painel e o fechar mantêm os filtros', async () => {
  window.location.hash = '#/processos'
  montar()
  within(await abrirFiltros()).getByLabelText('Setor')
  expect(screen.queryByLabelText('Situação')).toBeNull()
  await escolherNoQuadro('Setor', 'TSB')
  await waitFor(() => expect(window.location.hash).toBe('#/processos?setor=s2'))
  await waitFor(() => expect(screen.queryByRole('link', { name: /Pagar Diária/ })).toBeNull())
  fireEvent.click(screen.getByRole('link', { name: /Arquivar Pasta/ }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p4?setor=s2'))
  // O botão de fechar do "Carregando processo…" é trocado pelo do cabeçalho; clicar antes pegaria o que já saiu da tela.
  await screen.findByRole('heading', { name: 'Arquivar Pasta' })
  fireEvent.click(screen.getByRole('button', { name: 'Fechar a janela' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos?setor=s2'))
})

test('sem resultado: a mensagem e [Limpar filtros], que volta a mostrar tudo', async () => {
  window.location.hash = '#/processos/lista?setor=s2&tipo=subprocesso'
  montar()
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
  fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' }).at(-1) as HTMLElement)
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(await nomesNaLista()).toHaveLength(5)
})

test('[Limpar filtros] na barra só aparece com filtro ativo', async () => {
  montar()
  await nomesNaLista()
  expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull()
  await escolher('Tipo', 'Processo')
  fireEvent.click(await screen.findByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
})

test('a Consulta filtra a Lista, sem [Cadastrar processo]', async () => {
  montar({ perfil: 'consulta' })
  await escolher('Setor', 'TSB')
  await waitFor(async () => expect(await nomesNaLista()).toEqual(['Arquivar Pasta', 'Emitir Ofício']))
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})

test('com dois filtros, o nome do botão vai para o plural', async () => {
  window.location.hash = '#/processos?setor=s2&tipo=processo'
  montar()
  expect((await botaoDosFiltros()).getAttribute('aria-label')).toBe('Filtros, 2 ligados')
})

test('Esc com a lista de um seletor aberta fecha só a lista, não o painel', async () => {
  window.location.hash = '#/processos'
  montar()
  const seletor = within(await abrirFiltros()).getByLabelText('Setor')
  vi.spyOn(seletor, 'matches').mockImplementation((consulta: string) => consulta === ':open')
  fireEvent.keyDown(seletor, { key: 'Escape' })
  expect(painel()).not.toBeNull()
})

test('sair do painel com Tab fecha o painel', async () => {
  window.location.hash = '#/processos'
  montar()
  const seletor = within(await abrirFiltros()).getByLabelText('Responsável')
  fireEvent.focusOut(seletor, { relatedTarget: screen.getByRole('link', { name: /Pagar Diária/ }) })
  expect(painel()).toBeNull()
})

test('trocar de seletor dentro do painel não o fecha', async () => {
  window.location.hash = '#/processos'
  montar()
  const aberto = await abrirFiltros()
  fireEvent.focusOut(within(aberto).getByLabelText('Setor'), { relatedTarget: within(aberto).getByLabelText('Tipo') })
  expect(painel()).not.toBeNull()
})

test('depois de Limpar filtros no painel, o foco vai para o primeiro filtro', async () => {
  window.location.hash = '#/processos?tipo=processo'
  montar()
  const aberto = await abrirFiltros()
  fireEvent.click(within(aberto).getByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  await waitFor(() => expect(document.activeElement).toBe(within(aberto).getByLabelText('Setor')))
})
