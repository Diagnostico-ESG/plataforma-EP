import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { DadosDoCartao, ResponsavelDoProcesso } from './processos/tipos'
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
const trocar = async (nome: 'Etapa' | 'Responsável') => fireEvent.click(await screen.findByRole('button', { name: nome }))
const grupo = async () => within(await screen.findByRole('group', { name: 'Agrupar por' }))

test('a barra tem o Agrupar por, com Etapa escolhida, e o clique inverte os dois botões', async () => {
  montar([com('Emitir Ofício', ANA)])
  const barra = await grupo()
  expect(barra.getByRole('button', { name: 'Etapa' }).getAttribute('aria-pressed')).toBe('true')
  expect(barra.getByRole('button', { name: 'Responsável' }).getAttribute('aria-pressed')).toBe('false')
  await trocar('Responsável')
  expect(barra.getByRole('button', { name: 'Etapa' }).getAttribute('aria-pressed')).toBe('false')
  expect(barra.getByRole('button', { name: 'Responsável' }).getAttribute('aria-pressed')).toBe('true')
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

test('o cartão mostra a barra da etapa no lugar do avatar e perde o selo Sem responsável', async () => {
  montar([com('Emitir Ofício', ANA), sem('Sem Dono')])
  const semDono = await cartaoDe('Sem Dono')
  expect(semDono.querySelector('.cartao-selos')?.textContent).toContain('Sem responsável')
  expect((await cartaoDe('Emitir Ofício')).querySelector('.avatar')).not.toBeNull()
  await trocar('Responsável')
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.querySelector('.barra-etapa-texto')?.textContent).toBe('Revisão interna · 4 de 8')
  expect(cartao.querySelector('.avatar')).toBeNull()
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
  expect((await grupo()).getByRole('button', { name: 'Responsável' }).getAttribute('aria-pressed')).toBe('true')
  expect(titulos()).toEqual(['Ana Teste 1'])
})

test('a Consulta também vê o Agrupar por e as colunas por pessoa', async () => {
  montar([com('Emitir Ofício', ANA)], 'consulta')
  await cartaoDe('Emitir Ofício')
  await trocar('Responsável')
  expect(titulos()).toEqual(['Ana Teste 1'])
})
