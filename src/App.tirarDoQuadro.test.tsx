import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import type { ProcessoLido } from './processos/tipos'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'

// Tirar do Quadro (ticket 03 de repositorio-de-processos): o botão no cartão da coluna Concluídos e no verso, o aviso com
// Desfazer, o pé da coluna e o Quadro por responsável sem concluídos.

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const concluido = (nome: string, mudancas: Partial<ProcessoLido> = {}) =>
  processo(nome, { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido', noQuadro: true, ...mudancas } })
const foraDoQuadro = (nome: string, mudancas: Partial<ProcessoLido> = {}) => concluido(nome, { noQuadro: false, ...mudancas })

const coluna = () => screen.getByRole('region', { name: 'Concluídos' })
const nomesNaColuna = () => Array.from(coluna().querySelectorAll('.cartao-nome')).map((nome) => nome.textContent)
const botaoDo = (nome: string) => within(coluna()).queryByRole('button', { name: `Tirar do Quadro: ${nome}` })
const aviso = () => screen.queryByRole('status', { name: 'Tirado do Quadro' })

async function abrir(processos: ProcessoLido[], perfil: Perfil = 'integrante_ep') {
  const falso = montar(processos, perfil)
  await screen.findByRole('region', { name: 'Concluídos' })
  await waitFor(() => expect(document.querySelectorAll('.cartao').length).toBeGreaterThan(0))
  return falso
}

test('a coluna Concluídos lista só o que está no Quadro, e o botão aparece só para quem altera', async () => {
  await abrir([concluido('Pronto'), foraDoQuadro('Antigo')])
  expect(nomesNaColuna()).toEqual(['Pronto'])
  expect(botaoDo('Pronto')).toBeTruthy()
  cleanup()
  await abrir([concluido('Pronto')], 'consulta')
  expect(nomesNaColuna()).toEqual(['Pronto'])
  expect(botaoDo('Pronto')).toBeNull()
})

test('o botão é um botão de verdade, fora do link do cartão, e não aparece nas outras colunas', async () => {
  await abrir([concluido('Pronto'), processo('Em Curso')])
  const botao = botaoDo('Pronto') as HTMLElement
  expect(botao.tagName).toBe('BUTTON')
  expect(botao.closest('a')).toBeNull()
  expect(botao.getAttribute('tabindex')).not.toBe('-1')
  expect(screen.getAllByRole('button', { name: /^Tirar do Quadro/ })).toHaveLength(1)
})

test('tirar leva o cartão para fora da coluna e mostra o aviso; Desfazer devolve o cartão', async () => {
  const falso = await abrir([concluido('Pronto'), concluido('Outro')])
  fireEvent.click(botaoDo('Pronto') as HTMLElement)
  await waitFor(() => expect(nomesNaColuna()).toEqual(['Outro']))
  const mostrado = (await screen.findByRole('status', { name: 'Tirado do Quadro' })) as HTMLElement
  expect(mostrado.textContent).toContain('Tirado do Quadro')
  expect(falso.processos.find((p) => p.nome === 'Pronto')?.noQuadro).toBe(false)
  fireEvent.click(within(mostrado).getByRole('button', { name: 'Desfazer' }))
  await waitFor(() => expect(nomesNaColuna()).toEqual(['Outro', 'Pronto']))
  expect(aviso()).toBeNull()
})

test('fechar o aviso o esconde sem devolver o cartão', async () => {
  await abrir([concluido('Pronto')])
  fireEvent.click(botaoDo('Pronto') as HTMLElement)
  const mostrado = (await screen.findByRole('status', { name: 'Tirado do Quadro' })) as HTMLElement
  fireEvent.click(within(mostrado).getByRole('button', { name: 'Fechar o aviso' }))
  expect(aviso()).toBeNull()
  expect(nomesNaColuna()).toEqual([])
})

test('falha ao tirar deixa o cartão no lugar, com a mensagem em vermelho e sem aviso', async () => {
  const falso = await abrir([concluido('Pronto')])
  falso.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  fireEvent.click(botaoDo('Pronto') as HTMLElement)
  expect((await screen.findByRole('alert')).textContent).toContain('Seu perfil não permite alterar os processos.')
  expect(nomesNaColuna()).toEqual(['Pronto'])
  expect(aviso()).toBeNull()
})

test('falha ao desfazer deixa o cartão fora, com a mensagem', async () => {
  const falso = await abrir([concluido('Pronto')])
  fireEvent.click(botaoDo('Pronto') as HTMLElement)
  const mostrado = (await screen.findByRole('status', { name: 'Tirado do Quadro' })) as HTMLElement
  falso.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  fireEvent.click(within(mostrado).getByRole('button', { name: 'Desfazer' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Seu perfil não permite alterar os processos.')
  expect(nomesNaColuna()).toEqual([])
})

test('o pé da coluna conta os concluídos fora do Quadro (singular com um) e some quando não há', async () => {
  await abrir([concluido('Pronto'), foraDoQuadro('Antigo'), foraDoQuadro('Velho')])
  expect(within(coluna()).getByText(/2 concluídos fora do Quadro/)).toBeTruthy()
  cleanup()
  await abrir([concluido('Pronto'), foraDoQuadro('Antigo')])
  expect(within(coluna()).getByText(/^1 concluído fora do Quadro/)).toBeTruthy()
  cleanup()
  await abrir([concluido('Pronto')])
  expect(within(coluna()).queryByText(/fora do Quadro/)).toBeNull()
})

test('o pé conta depois dos filtros do Quadro e "Ver na Lista" leva os filtros para a Lista em Concluídos', async () => {
  window.location.hash = '#/processos?setor=s1'
  await abrir([
    processo('Em Curso'), foraDoQuadro('Antigo', { setorId: 's1', setorSigla: 'TSA' }), foraDoQuadro('Velho', { setorId: 's2', setorSigla: 'TSB' }),
  ])
  expect(within(coluna()).getByText(/^1 concluído fora do Quadro/)).toBeTruthy()
  const ver = within(coluna()).getByRole('link', { name: 'Ver na Lista' })
  expect(ver.getAttribute('href')).toBe('#/processos/lista?setor=s1&mostrar=concluidos')
  fireEvent.click(ver)
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?setor=s1&mostrar=concluidos'))
  expect((await screen.findByRole('button', { name: 'Concluídos' })).getAttribute('aria-pressed')).toBe('true')
  expect(await screen.findByText('Antigo', { selector: '.cadastros-abrir' })).toBeTruthy()
  expect(screen.queryByText('Velho', { selector: '.cadastros-abrir' })).toBeNull()
})

test('o verso do concluído no Quadro traz Tirar do Quadro; tirar por ele tira o cartão e mostra o aviso', async () => {
  await abrir([concluido('Pronto'), foraDoQuadro('Antigo')])
  fireEvent.click(await cartaoDe('Pronto'))
  const verso = within(await screen.findByRole('dialog', { name: /^Processo/ }))
  fireEvent.click(await verso.findByRole('button', { name: 'Tirar do Quadro' }))
  await waitFor(() => expect(verso.queryByRole('button', { name: 'Tirar do Quadro' })).toBeNull())
  expect(await screen.findByRole('status', { name: 'Tirado do Quadro' })).toBeTruthy()
  expect(nomesNaColuna()).toEqual([])
})

test('o verso do concluído que já está fora do Quadro não traz o botão', async () => {
  window.location.hash = '#/processos/lista'
  montar([foraDoQuadro('Antigo')])
  fireEvent.click((await screen.findAllByRole('cell', { name: 'TSA' }))[0])
  const verso = within(await screen.findByRole('dialog', { name: /^Processo/ }))
  await verso.findByRole('heading', { name: 'Antigo' })
  expect(verso.queryByRole('button', { name: 'Tirar do Quadro' })).toBeNull()
})

test('o verso da Consulta não traz o botão, mesmo com o concluído no Quadro', async () => {
  await abrir([concluido('Pronto')], 'consulta')
  fireEvent.click(await cartaoDe('Pronto'))
  const verso = within(await screen.findByRole('dialog', { name: /^Processo/ }))
  await verso.findByRole('heading', { name: 'Pronto' })
  expect(verso.queryByRole('button', { name: 'Tirar do Quadro' })).toBeNull()
})

test('o Quadro por responsável não mostra concluídos, mesmo com responsável', async () => {
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([concluido('Pronto'), processo('Em Curso')])
  await screen.findByText('Em Curso', { selector: '.cartao-nome' })
  expect(screen.queryByText('Pronto', { selector: '.cartao-nome' })).toBeNull()
})
