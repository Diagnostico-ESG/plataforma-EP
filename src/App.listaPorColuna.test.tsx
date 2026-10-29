import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { botaoDaColuna, escolherNaColuna, nomesNasLinhas, opcoesDaColuna } from './testes/cabecalhoDaLista'
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
const naEtapa = ({ codigo, nome, ordem }: EtapaDoCatalogo) => ({ codigo, nome, ordem, id: 'e', posicao: 1, total: 1 })

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    situacao: 'em_andamento', etapaAtual: naEtapa(MODELAGEM),
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null,
    motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária'),
  processo('p2', 'Conferir Recibo', { tipo: 'subprocesso', processoPaiId: 'p1', responsavel: ANA }),
  processo('p3', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB', situacao: 'concluido', etapaAtual: null }),
  processo('p4', 'Arquivar Pasta', {
    setorId: 's2', setorSigla: 'TSB', macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois', etapaAtual: naEtapa(RELATORIO), tipo: 'a_classificar',
  }),
  processo('p5', 'Cadastrar Bem', { responsavel: ANA }),
]

function montar(ajustar?: (falso: ProcessosFalso) => void) {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM, RELATORIO]
  falso.processos = PROCESSOS
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
}

const barraDeCima = () => document.querySelector('.quadro-barra') as HTMLElement

test('a Lista não tem a barra de filtros; acima da tabela ficam a busca, Todos | Concluídos e, com filtro, Limpar filtros', async () => {
  montar()
  await nomesNasLinhas()
  expect(screen.queryByRole('group', { name: 'Filtros dos processos' })).toBeNull()
  expect(within(barraDeCima()).getByRole('textbox', { name: 'Buscar pelo nome' })).toBeTruthy()
  expect(within(barraDeCima()).getByRole('button', { name: 'Todos' })).toBeTruthy()
  expect(within(barraDeCima()).queryByRole('button', { name: 'Limpar filtros' })).toBeNull()
  await escolherNaColuna('Tipo', 'Processo')
  fireEvent.click(await within(barraDeCima()).findByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
})

test('a primeira coluna se chama Processo e o menu dela só ordena', async () => {
  montar()
  const cabecalhos = (await screen.findAllByRole('columnheader')).map((celula) => celula.textContent)
  expect(cabecalhos[0]).toMatch(/^Processo/)
  expect(await opcoesDaColuna('Processo')).toEqual(['Crescente', 'Decrescente'])
})

test('o filtro de Setor no cabeçalho troca as linhas, vai para o endereço e aparece no cabeçalho', async () => {
  montar()
  expect(await opcoesDaColuna('Setor')).toEqual(['Crescente', 'Decrescente', 'Todos', 'TSA', 'TSB'])
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'TSB' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?setor=s2'))
  expect(await nomesNasLinhas()).toEqual(['Arquivar Pasta', 'Emitir Ofício'])
  expect((await botaoDaColuna('Setor')).textContent).toMatch(/filtrado: TSB/)
  fireEvent.click(await botaoDaColuna('Setor'))
  expect(screen.getByRole('menuitemradio', { name: 'TSB' }).getAttribute('aria-checked')).toBe('true')
})

test('Etapa atual em ordem decrescente segue o catálogo, marca o cabeçalho e vai para o endereço; sem etapa fica no fim', async () => {
  montar()
  await escolherNaColuna('Etapa atual', 'Decrescente')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?ordenar=etapa&sentido=decrescente'))
  expect(await nomesNasLinhas()).toEqual(['Arquivar Pasta', 'Cadastrar Bem', 'Pagar Diária', 'Conferir Recibo', 'Emitir Ofício'])
  expect((await botaoDaColuna('Etapa atual')).closest('th')?.getAttribute('aria-sort')).toBe('descending')
  expect((await botaoDaColuna('Processo')).closest('th')?.getAttribute('aria-sort')).toBeNull()
})

test('Responsável em ordem crescente deixa quem não tem responsável no fim', async () => {
  montar()
  await escolherNaColuna('Responsável', 'Crescente')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?ordenar=responsavel'))
  expect(await nomesNasLinhas()).toEqual(['Cadastrar Bem', 'Arquivar Pasta', 'Emitir Ofício', 'Pagar Diária', 'Conferir Recibo'])
})

test('o subprocesso vem logo depois do pai também ordenando por Setor', async () => {
  montar()
  await escolherNaColuna('Setor', 'Crescente')
  await waitFor(async () => expect(await nomesNasLinhas()).toEqual(['Cadastrar Bem', 'Pagar Diária', 'Conferir Recibo', 'Arquivar Pasta', 'Emitir Ofício']))
})

test('com Concluídos, a Situação só ordena', async () => {
  window.location.hash = '#/processos/lista?mostrar=concluidos'
  montar()
  expect(await opcoesDaColuna('Situação')).toEqual(['Crescente', 'Decrescente'])
})

test('a Situação filtra por Em andamento, Suspenso e Concluído, sem Cancelado', async () => {
  montar()
  expect(await opcoesDaColuna('Situação')).toEqual(['Crescente', 'Decrescente', 'Todas', 'Em andamento', 'Suspenso', 'Concluído'])
})

test('recarregar com filtro e ordenação no endereço mostra a mesma visão', async () => {
  window.location.hash = '#/processos/lista?tipo=processo&ordenar=responsavel&sentido=decrescente'
  montar()
  expect(await nomesNasLinhas()).toEqual(['Cadastrar Bem', 'Emitir Ofício', 'Pagar Diária'])
  expect((await botaoDaColuna('Tipo')).textContent).toMatch(/filtrado: Processo/)
  expect((await botaoDaColuna('Responsável')).closest('th')?.getAttribute('aria-sort')).toBe('descending')
})

test('pelo teclado: seta para baixo abre o menu do cabeçalho e Esc fecha e devolve o foco', async () => {
  montar()
  const botao = await botaoDaColuna('Macroprocesso')
  botao.focus()
  fireEvent.keyDown(botao, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Crescente' }))
  fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })
  expect(screen.queryByRole('menu')).toBeNull()
  expect(document.activeElement).toBe(botao)
})

test('carregando: a tabela fantasma já tem o cabeçalho novo', async () => {
  montar((falso) => { falso.segurarListaDeProcessos = true })
  await screen.findByText('Carregando processos…')
  expect(Array.from(document.querySelectorAll('thead th')).map((celula) => celula.textContent)[0]).toBe('Processo')
})
