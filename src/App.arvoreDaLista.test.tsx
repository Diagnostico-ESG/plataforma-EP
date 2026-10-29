import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { escolherNaColuna } from './testes/cabecalhoDaLista'
import { VersoesFalso } from './versoes/VersoesFalso'
import type { Versao } from './versoes/tipos'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  window.location.hash = '#/processos/lista?agrupar=macroprocesso'
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
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [], ...mudancas,
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

const VERSAO_7: Versao = {
  id: 'v7', numero: 7, historica: false, piloto: false, enviadaEm: '2026-10-02T12:00:00Z', autor: null, etapa: null, aprovada: true,
  arquivos: [
    { id: 'a1', papel: 'png', nome: 'fluxo.png', formato: 'png', tamanho: 1 },
    { id: 'a2', papel: 'bpm', nome: 'fluxo.bpm', formato: 'bpm', tamanho: 1 },
    { id: 'a3', papel: 'relatorio', nome: 'relatorio.docx', formato: 'docx', tamanho: 1, numeroDoRelatorio: 2 },
  ],
}

function montar(perfil: Perfil = 'integrante_ep') {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM]
  falso.processos = PROCESSOS
  falso.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true, cor: 3 }, { id: 's2', sigla: 'TSB', nome: 'Setor B', ativo: true, cor: 5 },
  ]
  const versoes = new VersoesFalso()
  versoes.versoes = { p1: [VERSAO_7], p5: [] }
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={versoes} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return versoes
}

const macro = (nome: string) => screen.findByRole('button', { name: new RegExp(`^${nome},`) })
const setor = (nome: string) => screen.getByRole('button', { name: new RegExp(`^${nome}`) })
const nomes = () => Array.from(document.querySelectorAll('.tabela-de-processos tbody .cadastros-abrir')).map((botao) => botao.textContent)
const grupos = () => Array.from(document.querySelectorAll('.botao-do-grupo')).map((botao) => botao.getAttribute('aria-label'))
const seta = (nome: string) => screen.getByRole('button', { name: `Abrir arquivos de ${nome}` })

test('Agrupar por Macroprocesso mostra macro, setor e processos com as contagens; Nenhum volta à tabela', async () => {
  montar()
  await macro('Macro Um')
  expect(grupos()).toEqual([
    'Macro Dois, 1 processo', 'TSB Setor B, 1 processo', 'Macro Um, 4 processos', 'TSA Setor A, 3 processos', 'TSB Setor B, 1 processo',
  ])
  expect(nomes()).toEqual(['Arquivar Pasta', 'Cadastrar Bem', 'Pagar Diária', 'Conferir Recibo', 'Emitir Ofício'])
  const agrupar = screen.getByRole('group', { name: 'Agrupar por' })
  expect(within(agrupar).getByRole('button', { name: 'Macroprocesso' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(within(agrupar).getByRole('button', { name: 'Nenhum' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(document.querySelector('.linha-de-macro')).toBeNull()
  fireEvent.click(within(screen.getByRole('group', { name: 'Agrupar por' })).getByRole('button', { name: 'Macroprocesso' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?agrupar=macroprocesso'))
})

test('o subprocesso de outro setor vem recuado sob o pai, com o selo do setor dele', async () => {
  montar()
  await macro('Macro Um')
  const linha = screen.getByText('Conferir Recibo').closest('tr') as HTMLElement
  expect(linha.querySelector('td')?.classList.contains('processo-recuado')).toBe(true)
  expect(within(linha).getByText('TSB')).toBeTruthy()
  expect(within(linha).queryByText(/subprocesso de/)).toBeNull()
})

test('o subprocesso cujo pai foi filtrado vem sob o próprio setor, no macroprocesso do pai, com "subprocesso de"', async () => {
  montar()
  await macro('Macro Um')
  await escolherNaColuna('Setor', 'TSB')
  await waitFor(() => expect(grupos()).toEqual(['Macro Dois, 1 processo', 'TSB Setor B, 1 processo', 'Macro Um, 2 processos', 'TSB Setor B, 2 processos']))
  const linha = screen.getByText('Conferir Recibo').closest('tr') as HTMLElement
  expect(within(linha).getByText('subprocesso de Pagar Diária')).toBeTruthy()
  expect(linha.querySelector('td')?.classList.contains('processo-recuado')).toBe(false)
})

test('Concluídos e a ordenação valem na árvore; ramos vazios somem e a ordem dos grupos não muda', async () => {
  montar()
  await macro('Macro Um')
  await escolherNaColuna('Processo', 'Decrescente')
  await waitFor(() => expect(nomes()).toEqual(['Arquivar Pasta', 'Pagar Diária', 'Conferir Recibo', 'Cadastrar Bem', 'Emitir Ofício']))
  expect(grupos()[0]).toBe('Macro Dois, 1 processo')
  fireEvent.click(screen.getByRole('button', { name: 'Concluídos' }))
  await waitFor(() => expect(grupos()).toEqual(['Macro Um, 1 processo', 'TSB Setor B, 1 processo']))
  expect(nomes()).toEqual(['Emitir Ofício'])
})

test('fechar um macroprocesso esconde os setores e os processos dele', async () => {
  montar()
  fireEvent.click(await macro('Macro Um'))
  expect(nomes()).toEqual(['Arquivar Pasta'])
  expect(screen.queryByRole('button', { name: /^TSA Setor A/ })).toBeNull()
  fireEvent.click(await macro('Macro Um'))
  fireEvent.click(setor('TSA Setor A'))
  expect(nomes()).toEqual(['Arquivar Pasta', 'Emitir Ofício'])
})

test('a seta abre a linha dos arquivos: Carregando, depois a versão, o selo Aprovada e os links; só o processo aberto é lido', async () => {
  const versoes = montar()
  const ler = vi.spyOn(versoes, 'listarVersoes')
  await macro('Macro Um')
  fireEvent.click(seta('Pagar Diária'))
  expect(screen.getByText('Carregando arquivos…')).toBeTruthy()
  expect(await screen.findByText('V7')).toBeTruthy()
  expect(screen.getByText('Aprovada')).toBeTruthy()
  const linha = document.querySelector('.linha-dos-arquivos') as HTMLElement
  expect(within(linha).getAllByRole('link').map((link) => link.textContent)).toEqual(['Imagem .png', 'Fluxograma .bpm', 'Relatório V2'])
  fireEvent.click(within(linha).getByRole('link', { name: /Baixar Relatório V2/ }))
  await waitFor(() => expect(versoes.baixados).toEqual(['a3']))
  expect(ler.mock.calls.map(([id]) => id)).toEqual(['p1'])
  fireEvent.click(seta('Cadastrar Bem'))
  expect(await screen.findByText('Sem versão ainda.')).toBeTruthy()
})

test('a falha ao ler os arquivos mostra o erro com Tentar de novo, sem fechar a linha nem perder a árvore', async () => {
  const versoes = montar()
  versoes.falharLeitura = true
  await macro('Macro Um')
  fireEvent.click(seta('Pagar Diária'))
  expect(await screen.findByText(/Não foi possível carregar os arquivos\./)).toBeTruthy()
  expect(await macro('Macro Um')).toBeTruthy()
  versoes.falharLeitura = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('V7')).toBeTruthy()
})

test('Abrir todos abre todos os níveis e lê os arquivos de todos os processos; Fechar todos fecha tudo', async () => {
  const versoes = montar()
  const ler = vi.spyOn(versoes, 'listarVersoes')
  await macro('Macro Um')
  fireEvent.click(screen.getByRole('button', { name: 'Abrir todos' }))
  await waitFor(() => expect(ler).toHaveBeenCalledTimes(5))
  expect(await screen.findByText('V7')).toBeTruthy()
  expect(document.querySelectorAll('.linha-dos-arquivos')).toHaveLength(5)
  fireEvent.click(screen.getByRole('button', { name: 'Fechar todos' }))
  expect(nomes()).toEqual([])
  expect(document.querySelectorAll('.linha-dos-arquivos')).toHaveLength(0)
  expect(grupos()).toEqual(['Macro Dois, 1 processo', 'Macro Um, 4 processos'])
  expect(screen.getByRole('button', { name: 'Abrir todos' })).toBeTruthy()
})

test('os cancelados ficam numa lista no fim, fora dos ramos, com setor e macroprocesso', async () => {
  montar()
  await macro('Macro Um')
  expect(nomes()).not.toContain('Contrato Velho')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar cancelados (1)' }))
  const bloco = document.querySelector('.bloco-de-cancelados') as HTMLElement
  expect(within(bloco).getByText('Cancelados')).toBeTruthy()
  const linha = within(bloco).getByText('Contrato Velho').closest('tr') as HTMLElement
  expect(within(linha).getByText('TSA')).toBeTruthy()
  expect(within(linha).getByText('Macro Um')).toBeTruthy()
  expect(grupos()).toHaveLength(5)
})

test('clicar no nome do processo abre o verso; a seta não abre', async () => {
  montar()
  await macro('Macro Um')
  fireEvent.click(seta('Cadastrar Bem'))
  expect(window.location.hash).toBe('#/processos/lista?agrupar=macroprocesso')
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Bem' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista/p5?agrupar=macroprocesso'))
})

test('a Consulta vê a árvore e abre os arquivos, sem o botão de cadastrar', async () => {
  const versoes = montar('consulta')
  await macro('Macro Um')
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
  fireEvent.click(seta('Pagar Diária'))
  fireEvent.click(await screen.findByRole('link', { name: /Baixar Imagem/ }))
  await waitFor(() => expect(versoes.baixados).toEqual(['a1']))
})
