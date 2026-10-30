import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { escolherNaColuna } from './testes/cabecalhoDaLista'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  window.location.hash = '#/processos/lista?agrupar=setor'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM: EtapaDoCatalogo = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }
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
  processo('p2', 'Conferir Recibo', { tipo: 'subprocesso', processoPaiId: 'p1', setorId: 's2', setorSigla: 'TSB' }),
  processo('p3', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB', situacao: 'concluido', etapaAtual: null }),
  processo('p4', 'Arquivar Pasta', { setorId: 's2', setorSigla: 'TSB', macroprocessoId: 'm2', macroprocessoNome: 'Macro Dois' }),
  processo('p5', 'Cadastrar Bem'),
  processo('p6', 'Contrato Velho', { situacao: 'cancelado', etapaAtual: null }),
]

function montar() {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM]
  falso.processos = PROCESSOS
  falso.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true, cor: 3 }, { id: 's2', sigla: 'TSB', nome: 'Setor B', ativo: true, cor: 5 },
  ]
  const versoes = new VersoesFalso()
  versoes.versoes = { p1: [], p5: [] }
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={new CadastrosFalso()} processos={falso} versoes={versoes} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return versoes
}

const setor = (nome: string) => screen.findByRole('button', { name: new RegExp(`^${nome},`) })
const nomes = () => Array.from(document.querySelectorAll('.tabela-de-processos tbody .cadastros-abrir')).map((botao) => botao.textContent)
const grupos = () => Array.from(document.querySelectorAll('.botao-do-grupo')).map((botao) => botao.getAttribute('aria-label'))
const seta = (nome: string) => screen.getByRole('button', { name: `Abrir arquivos de ${nome}` })

test('Agrupar por Setor mostra setor, macroprocesso e processos, com as contagens; Nenhum volta à tabela', async () => {
  montar()
  await setor('TSA Setor A')
  expect(grupos()).toEqual([
    'TSA Setor A, 3 processos', 'Macro Um, 3 processos', 'TSB Setor B, 2 processos', 'Macro Dois, 1 processo', 'Macro Um, 1 processo',
  ])
  expect(nomes()).toEqual(['Cadastrar Bem', 'Pagar Diária', 'Conferir Recibo', 'Arquivar Pasta', 'Emitir Ofício'])
  const agrupar = screen.getByRole('group', { name: 'Agrupar por' })
  expect(within(agrupar).getAllByRole('button').map((botao) => botao.textContent)).toEqual(['Nenhum', 'Macroprocesso', 'Setor'])
  expect(within(agrupar).getByRole('button', { name: 'Setor' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(within(agrupar).getByRole('button', { name: 'Nenhum' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(document.querySelector('.botao-do-grupo')).toBeNull()
  fireEvent.click(within(screen.getByRole('group', { name: 'Agrupar por' })).getByRole('button', { name: 'Setor' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?agrupar=setor'))
})

test('o setor é a linha de cima e o macroprocesso vem recuado abaixo dele', async () => {
  montar()
  await setor('TSA Setor A')
  const linhas = Array.from(document.querySelectorAll('tr.grupo-raiz, tr.grupo-filho'))
  expect(linhas.map((linha) => linha.className)).toEqual([
    'linha-de-setor grupo-raiz', 'linha-de-macro grupo-filho', 'linha-de-setor grupo-raiz', 'linha-de-macro grupo-filho', 'linha-de-macro grupo-filho',
  ])
  expect(within(linhas[0] as HTMLElement).getByText('TSA')).toBeTruthy()
})

test('o subprocesso de outro setor vem recuado sob o pai, com o selo do setor dele', async () => {
  montar()
  await setor('TSA Setor A')
  const linha = screen.getByText('Conferir Recibo').closest('tr') as HTMLElement
  expect(linha.querySelector('td')?.classList.contains('processo-recuado')).toBe(true)
  expect(within(linha).getByText('TSB')).toBeTruthy()
  expect(within(linha).queryByText(/subprocesso de/)).toBeNull()
})

test('o subprocesso cujo pai foi filtrado vem sozinho no próprio setor, no macroprocesso do pai, com "subprocesso de"', async () => {
  montar()
  await setor('TSA Setor A')
  await escolherNaColuna('Setor', 'TSB')
  await waitFor(() => expect(grupos()).toEqual(['TSB Setor B, 3 processos', 'Macro Dois, 1 processo', 'Macro Um, 2 processos']))
  const linha = screen.getByText('Conferir Recibo').closest('tr') as HTMLElement
  expect(within(linha).getByText('subprocesso de Pagar Diária')).toBeTruthy()
  expect(linha.querySelector('td')?.classList.contains('processo-recuado')).toBe(false)
})

test('Concluídos e a ordenação valem na árvore; ramos vazios somem e a ordem dos grupos não muda', async () => {
  montar()
  await setor('TSA Setor A')
  await escolherNaColuna('Processo', 'Decrescente')
  await waitFor(() => expect(nomes()).toEqual(['Pagar Diária', 'Conferir Recibo', 'Cadastrar Bem', 'Arquivar Pasta', 'Emitir Ofício']))
  expect(grupos()[0]).toBe('TSA Setor A, 3 processos')
  fireEvent.click(screen.getByRole('button', { name: 'Concluídos' }))
  await waitFor(() => expect(grupos()).toEqual(['TSB Setor B, 1 processo', 'Macro Um, 1 processo']))
  expect(nomes()).toEqual(['Emitir Ofício'])
})

test('fechar um setor esconde os macroprocessos e os processos dele; setores e macroprocessos abrem por padrão', async () => {
  montar()
  fireEvent.click(await setor('TSA Setor A'))
  expect(grupos()).toEqual(['TSA Setor A, 3 processos', 'TSB Setor B, 2 processos', 'Macro Dois, 1 processo', 'Macro Um, 1 processo'])
  expect(nomes()).toEqual(['Arquivar Pasta', 'Emitir Ofício'])
  expect(document.querySelectorAll('.linha-dos-arquivos')).toHaveLength(0)
})

test('Abrir todos abre todos os níveis e lê os arquivos de todos os processos; Fechar todos fecha tudo', async () => {
  const versoes = montar()
  const ler = vi.spyOn(versoes, 'listarVersoes')
  await setor('TSA Setor A')
  fireEvent.click(screen.getByRole('button', { name: 'Abrir todos' }))
  await waitFor(() => expect(ler).toHaveBeenCalledTimes(5))
  await waitFor(() => expect(document.querySelectorAll('.linha-dos-arquivos')).toHaveLength(5))
  fireEvent.click(screen.getByRole('button', { name: 'Fechar todos' }))
  expect(nomes()).toEqual([])
  expect(document.querySelectorAll('.linha-dos-arquivos')).toHaveLength(0)
  expect(grupos()).toEqual(['TSA Setor A, 3 processos', 'TSB Setor B, 2 processos'])
  expect(screen.getByRole('button', { name: 'Abrir todos' })).toBeTruthy()
})

test('a seta abre a linha dos arquivos do processo; só ele é lido', async () => {
  const versoes = montar()
  const ler = vi.spyOn(versoes, 'listarVersoes')
  await setor('TSA Setor A')
  fireEvent.click(seta('Cadastrar Bem'))
  expect(await screen.findByText('Sem versão ainda.')).toBeTruthy()
  expect(ler.mock.calls.map(([id]) => id)).toEqual(['p5'])
})

test('os cancelados ficam numa lista no fim, fora dos ramos', async () => {
  montar()
  await setor('TSA Setor A')
  expect(nomes()).not.toContain('Contrato Velho')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar cancelados (1)' }))
  const bloco = document.querySelector('.bloco-de-cancelados') as HTMLElement
  expect(within(bloco).getByText('Contrato Velho')).toBeTruthy()
  expect(grupos()).toHaveLength(5)
})

test('o endereço antigo com busca= abre a Lista inteira, sem campo de busca e sem erro', async () => {
  window.location.hash = '#/processos/lista?busca=zzz'
  montar()
  expect(await screen.findByText('Cadastrar Bem')).toBeTruthy()
  expect(screen.getByText('Pagar Diária')).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  expect(document.querySelector('mark')).toBeNull()
})
