import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { escolherNaColuna, nomesNasLinhas } from './testes/cabecalhoDaLista'
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

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    situacao: 'em_andamento', etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem, id: 'e', posicao: 1, total: 1 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, dataDaModelagemPiloto: null, ultimaVersao: null, etapasDoVerso: [], ...mudancas,
  }
}

const PROCESSOS: ProcessoLido[] = [
  processo('p1', 'Pagar Diária'),
  processo('p2', 'Conferir Recibo'),
  processo('p3', 'Emitir Ofício', { setorId: 's2', setorSigla: 'TSB', situacao: 'concluido', etapaAtual: null }),
  processo('p4', 'Pagar Fornecedor', { setorId: 's2', setorSigla: 'TSB' }),
]

function montar() {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [MODELAGEM]
  falso.processos = PROCESSOS
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
}

const nomesNaLista = nomesNasLinhas

async function buscar(texto: string) {
  fireEvent.change(await screen.findByRole('textbox', { name: 'Buscar pelo nome' }), { target: { value: texto } })
}

test('digitar filtra a Lista pelo trecho do nome, sem diferenciar maiúsculas e acentos, e vai para o endereço', async () => {
  montar()
  await buscar('PAGAR')
  expect(await nomesNaLista()).toEqual(['Pagar Diária', 'Pagar Fornecedor'])
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?busca=PAGAR'))
  await buscar('oficio')
  expect(await nomesNaLista()).toEqual(['Emitir Ofício'])
})

test('a busca se soma aos filtros', async () => {
  montar()
  await escolherNaColuna('Setor', 'TSB')
  await buscar('pagar')
  expect(await nomesNaLista()).toEqual(['Pagar Fornecedor'])
})

test('o endereço com busca já abre a Lista filtrada, com o campo preenchido', async () => {
  window.location.hash = '#/processos/lista?busca=recibo'
  montar()
  expect(await nomesNaLista()).toEqual(['Conferir Recibo'])
  expect((screen.getByRole('textbox', { name: 'Buscar pelo nome' }) as HTMLInputElement).value).toBe('recibo')
})

test('o trecho achado fica marcado e o nome continua inteiro para o leitor de tela', async () => {
  montar()
  await buscar('diar')
  const botao = (await screen.findAllByRole('button', { name: 'Pagar Diária' }))[0]
  expect(botao.textContent).toBe('Pagar Diária')
  const marcas = botao.querySelectorAll('mark')
  expect(marcas).toHaveLength(1)
  expect(marcas[0].textContent).toBe('Diár')
})

test('o "×" aparece só com texto e limpa a busca', async () => {
  montar()
  await screen.findByRole('textbox', { name: 'Buscar pelo nome' })
  expect(screen.queryByRole('button', { name: 'Limpar busca' })).toBeNull()
  await buscar('pagar')
  fireEvent.click(await screen.findByRole('button', { name: 'Limpar busca' }))
  expect(await nomesNaLista()).toHaveLength(4)
  expect((screen.getByRole('textbox', { name: 'Buscar pelo nome' }) as HTMLInputElement).value).toBe('')
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
})

test('sem resultado mostra a mensagem, e [Limpar filtros] limpa filtros e busca', async () => {
  montar()
  await escolherNaColuna('Setor', 'TSB')
  await buscar('zzz')
  await screen.findByText('Nenhum processo com estes filtros.')
  fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0])
  expect(await nomesNaLista()).toHaveLength(4)
  expect((screen.getByRole('textbox', { name: 'Buscar pelo nome' }) as HTMLInputElement).value).toBe('')
  expect(window.location.hash).toBe('#/processos/lista')
})

test('o Quadro não tem o campo de busca', async () => {
  window.location.hash = '#/processos'
  montar()
  await screen.findByLabelText('Setor')
  expect(screen.queryByRole('textbox', { name: 'Buscar pelo nome' })).toBeNull()
})

test('digitar a busca não enche o histórico do navegador: o Voltar não anda letra por letra', async () => {
  montar()
  await screen.findByRole('textbox', { name: 'Buscar pelo nome' })
  const antes = window.history.length
  for (const texto of ['P', 'Pa', 'Pag', 'Paga']) await buscar(texto)
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?busca=Paga'))
  expect(window.history.length).toBe(antes)
})
