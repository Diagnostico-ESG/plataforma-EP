import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { DadosDoCartao, ResponsavelDoProcesso } from './processos/tipos'
import { botaoDaFormaDeVer, escolherFormaDeVer } from './testes/formaDeVer'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

type Pessoa = { responsavel: ResponsavelDoProcesso; cartao: Partial<DadosDoCartao> }
const de = (id: string, nome: string, ativo = true): Pessoa => ({
  responsavel: { id, nome, fotoUrl: null }, cartao: { responsavelAtivo: ativo },
})
const com = (nome: string, quem: Pessoa, etapa = 'revisao_interna') =>
  processo(nome, { etapa, processo: { responsavel: quem.responsavel }, cartao: quem.cartao })

const ANA = de('u1', 'Ana Teste')
const BIA_INATIVA = de('u2', 'Bia Teste', false)
const CAIO = de('u3', 'Caio Teste')

const sem = (nome: string) => processo(nome, { processo: { responsavel: null } })
// Nome da coluna e contagem, separados por espaço (a pílula Inativo, quando há, vai dentro do nome).
const titulos = () => Array.from(document.querySelectorAll('.coluna-titulo')).map((titulo) => Array.from(titulo.children).map((parte) => parte.textContent).join(' '))
const trocar = (nome: 'Etapa' | 'Responsável') => escolherFormaDeVer(nome === 'Etapa' ? 'Quadro por etapa' : 'Quadro por responsável')

test('"Quadro ▾" começa em Quadro por etapa e passa a Quadro por responsável ao escolher', async () => {
  montar([com('Emitir Ofício', ANA)])
  expect((await botaoDaFormaDeVer()).textContent).toContain('Quadro por etapa')
  await trocar('Responsável')
  expect((await botaoDaFormaDeVer()).textContent).toContain('Quadro por responsável')
})

test('por etapa as colunas são as etapas; por responsável, uma por pessoa em ordem de nome e Sem responsável no fim', async () => {
  montar([com('Emitir Ofício', CAIO), com('Pagar Diária', ANA), com('Revisar Edital', ANA), sem('Sem Dono')])
  await cartaoDe('Emitir Ofício')
  expect(screen.queryByRole('region', { name: 'Ana Teste' })).toBeNull()
  await trocar('Responsável')
  expect(titulos()).toEqual(['Ana Teste 2', 'Caio Teste 1', 'Sem responsável 1'])
})

test('a coluna Sem responsável só existe quando há cartão nela', async () => {
  montar([com('Emitir Ofício', ANA)])
  await cartaoDe('Emitir Ofício')
  await trocar('Responsável')
  expect(screen.queryByRole('region', { name: 'Sem responsável' })).toBeNull()
})

test('a coluna da pessoa desativada leva a pílula Inativo; a da ativa, não', async () => {
  montar([com('Emitir Ofício', ANA), com('Pagar Diária', BIA_INATIVA)])
  await cartaoDe('Emitir Ofício')
  await trocar('Responsável')
  expect(within(screen.getByRole('region', { name: 'Bia Teste' })).getByText('Inativo')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Ana Teste' })).queryByText('Inativo')).toBeNull()
})

test('o cartão mostra a barra da etapa e dispensa a linha do responsável; sem responsável, nunca há selo', async () => {
  montar([com('Emitir Ofício', ANA), sem('Sem Dono')])
  expect((await cartaoDe('Sem Dono')).querySelector('.cartao-selos')).toBeNull()
  expect((await cartaoDe('Emitir Ofício')).querySelector('.cartao-responsavel')).not.toBeNull()
  await trocar('Responsável')
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.querySelector('.barra-etapa-texto')?.textContent).toBe('Revisão interna · 4 de 8')
  expect(cartao.querySelector('.cartao-responsavel')).toBeNull()
  expect((await cartaoDe('Sem Dono')).querySelector('.cartao-selos')).toBeNull()
})

test('por responsável nenhum cartão se arrasta; voltando para Etapa, o arrastar volta', async () => {
  montar([com('Emitir Ofício', ANA)])
  expect((await cartaoDe('Emitir Ofício')).getAttribute('draggable')).toBe('true')
  await trocar('Responsável')
  expect((await cartaoDe('Emitir Ofício')).getAttribute('draggable')).toBe('false')
  await trocar('Etapa')
  expect((await cartaoDe('Emitir Ofício')).getAttribute('draggable')).toBe('true')
})

test('o filtro de etapa continua valendo no Quadro por responsável', async () => {
  window.location.hash = '#/processos?etapa=revisao_interna&agrupar=responsavel'
  montar([com('Na Revisão', ANA), com('Na Aprovação', CAIO, 'aprovacao_setor')])
  await cartaoDe('Na Revisão')
  expect(titulos()).toEqual(['Ana Teste 1'])
})

test('o agrupamento fica no endereço: escolher grava, voltar a Etapa limpa, e abrir já agrupado mantém', async () => {
  montar([com('Emitir Ofício', ANA)])
  await trocar('Responsável')
  await waitFor(() => expect(window.location.hash).toBe('#/processos?agrupar=responsavel'))
  await trocar('Etapa')
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  cleanup()
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([com('Emitir Ofício', ANA)])
  await cartaoDe('Emitir Ofício')
  expect((await botaoDaFormaDeVer()).textContent).toContain('Quadro por responsável')
  expect(titulos()).toEqual(['Ana Teste 1'])
})

test('a Consulta também escolhe o Quadro por responsável e vê as colunas por pessoa', async () => {
  montar([com('Emitir Ofício', ANA)], 'consulta')
  await cartaoDe('Emitir Ofício')
  await trocar('Responsável')
  expect(titulos()).toEqual(['Ana Teste 1'])
})
