import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { Perfil } from './acesso/tipos'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { ProcessoLido, SetorDoQuadro } from './processos/tipos'
import { umSetor } from './testes/processoDaLista'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const TSA = umSetor('s1', 'TSA', 'Setor de Testes A')
const ABC = umSetor('s2', 'ABC', 'Assessoria Fictícia')
const MNO = umSetor('s3', 'MNO', 'Setor Antigo', false)
const XYZ = umSetor('s4', 'XYZ', 'Setor Esquecido', false)
const SETORES = [TSA, ABC, MNO, XYZ]

const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome, fotoUrl: null }
const doSetor = (nome: string, { id, sigla }: SetorDoQuadro, mudancas: Partial<ProcessoLido> = {}) =>
  processo(nome, { processo: { setorId: id, setorSigla: sigla, ...mudancas } })

const abrir = (processos: ProcessoLido[], perfil: Perfil = 'integrante_ep') => montar(processos, perfil, [], new VersoesFalso(), SETORES)
const trocar = async (nome: 'Etapa' | 'Setor') => fireEvent.click(await screen.findByRole('button', { name: nome }))
// Sigla, nome do setor e contagem, separados por espaço (a pílula Inativo, quando há, vai junto da sigla).
const titulos = () => Array.from(document.querySelectorAll('.coluna-titulo')).map((titulo) => titulo.textContent?.replace(/\s+/g, ' ').trim())

test('Agrupar por: Setor monta uma coluna por setor ativo em ordem de sigla, com a sigla e o nome, mesmo vazia', async () => {
  abrir([doSetor('Emitir Ofício', TSA)])
  await trocar('Setor')
  expect((await screen.findByRole('button', { name: 'Setor' })).getAttribute('aria-pressed')).toBe('true')
  expect(titulos()).toEqual(['TSASetor de Testes A1', 'ABCAssessoria Fictícia0'])
  const vazia = screen.getByRole('region', { name: 'ABC · Assessoria Fictícia' })
  expect(within(vazia).getByText('Nenhum processo deste setor no Quadro.')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'TSA · Setor de Testes A' })).queryByText(/Nenhum processo/)).toBeNull()
})

test('o setor inativo só tem coluna com processo, marcada Inativo, na ordem de sigla', async () => {
  abrir([doSetor('Processo Antigo', MNO)])
  await trocar('Setor')
  await waitFor(() => expect(titulos()).toHaveLength(3))
  expect(within(screen.getByRole('region', { name: 'MNO · Setor Antigo · inativo' })).getByText('Inativo')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'XYZ · Setor Esquecido' })).toBeNull()
  expect(Array.from(document.querySelectorAll('.coluna-titulo-principal')).map((sigla) => sigla.textContent)).toEqual(['MNO Inativo', 'ABC', 'TSA'])
})

test('o cartão traz a barra da etapa, a etiqueta e o responsável, sem o selo da sigla, e não se arrasta', async () => {
  abrir([doSetor('Emitir Ofício', TSA)])
  expect((await cartaoDe('Emitir Ofício')).querySelector('.selo-do-setor')?.textContent).toBe('TSA')
  await trocar('Setor')
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.querySelector('.barra-etapa-texto')?.textContent).toBe('Revisão interna · 4 de 8')
  expect(cartao.querySelector('.etiqueta')?.textContent).toBe('A fazer')
  expect(cartao.querySelector('.cartao-responsavel')).not.toBeNull()
  expect(cartao.querySelector('.selo-do-setor')).toBeNull()
  expect(cartao.querySelector('.cartao-nome')?.textContent).toBe('Emitir Ofício')
  expect(cartao.textContent).not.toContain('TSA')
  expect(cartao.getAttribute('draggable')).toBe('false')
})

test('o cartão não mostra o nome do macroprocesso em nenhum agrupamento, e por setor não leva o selo da sigla', async () => {
  abrir([doSetor('Emitir Ofício', TSA)])
  expect((await cartaoDe('Emitir Ofício')).textContent).not.toContain('Macro de Teste')
  expect((await cartaoDe('Emitir Ofício')).querySelector('.selo-do-setor')?.textContent).toBe('TSA')
  await trocar('Setor')
  const porSetor = await cartaoDe('Emitir Ofício')
  expect(porSetor.textContent).not.toContain('Macro de Teste')
  expect(porSetor.querySelector('.selo-do-setor')).toBeNull()
})

test('com o filtro Setor, só a coluna desse setor', async () => {
  window.location.hash = '#/processos?setor=s1&agrupar=setor'
  abrir([doSetor('Emitir Ofício', TSA), doSetor('Pagar Diária', ABC)])
  await cartaoDe('Emitir Ofício')
  expect(titulos()).toEqual(['TSASetor de Testes A1'])
})

test('com o Só os meus, as colunas dos setores ativos continuam, mesmo vazias', async () => {
  window.location.hash = '#/processos?agrupar=setor'
  abrir([doSetor('Meu Processo', TSA, { responsavel: EU }), doSetor('Processo Dela', ABC)])
  await cartaoDe('Processo Dela')
  fireEvent.click(await screen.findByRole('button', { name: 'Só os meus' }))
  await waitFor(() => expect(screen.queryByText('Processo Dela')).toBeNull())
  expect(titulos()).toEqual(['TSASetor de Testes A1', 'ABCAssessoria Fictícia0'])
})

test('o agrupamento por setor fica no endereço, e abrir já agrupado mantém', async () => {
  abrir([doSetor('Emitir Ofício', TSA)])
  await trocar('Setor')
  await waitFor(() => expect(window.location.hash).toBe('#/processos?agrupar=setor'))
  await trocar('Etapa')
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  cleanup()
  window.location.hash = '#/processos?agrupar=setor'
  abrir([doSetor('Emitir Ofício', TSA)])
  await cartaoDe('Emitir Ofício')
  expect(screen.getByRole('button', { name: 'Setor' }).getAttribute('aria-pressed')).toBe('true')
})

test('a Consulta também agrupa por setor e abre o cartão, sem arrastar', async () => {
  window.location.hash = '#/processos?agrupar=setor'
  abrir([doSetor('Emitir Ofício', TSA)], 'consulta')
  const cartao = await cartaoDe('Emitir Ofício')
  expect(screen.getByRole('region', { name: 'TSA · Setor de Testes A' })).toBeTruthy()
  expect(cartao.getAttribute('draggable')).toBe('false')
  expect(cartao.getAttribute('href')).toContain('agrupar=setor')
})
