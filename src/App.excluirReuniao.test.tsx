import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { fixarOHoje, linhasDasReunioes, montarReunioes } from './testes/reunioesDeTeste'

beforeEach(() => {
  window.location.hash = '#/reunioes'
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const painel = () => within(screen.getByRole('complementary', { name: 'Painel da reunião' }))
const TITULO_DA_JANELA = 'Excluir a reunião de modelagem de 01/10/2026?'

async function abrirAJanela(montagem: Parameters<typeof montarReunioes>[0] = {}) {
  const falso = montarReunioes(montagem)
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  fireEvent.click(await painel().findByRole('button', { name: 'Excluir' }))
  return falso
}

const confirmar = () => fireEvent.click(screen.getByRole('button', { name: 'Excluir reunião' }))

test('Excluir abre a janela com o texto da spec e o foco no Cancelar', async () => {
  await abrirAJanela()
  const janela = within(screen.getByRole('dialog', { name: TITULO_DA_JANELA }))
  expect(janela.getByText('O histórico guarda o que ela tinha, mas não é possível desfazer.')).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Excluir reunião' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('Cancelar e Esc fecham a janela sem excluir', async () => {
  const falso = await abrirAJanela()
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(painel().getByRole('button', { name: 'Excluir' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(falso.reunioes).toHaveLength(5)
  expect(screen.getByRole('complementary', { name: 'Painel da reunião' })).toBeTruthy()
})

test('confirmar exclui a reunião, tira a linha da lista e fecha o painel', async () => {
  const falso = await abrirAJanela()
  confirmar()
  await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Painel da reunião' })).toBeNull())
  await waitFor(() => expect(screen.queryByRole('button', { name: '01/10/2026' })).toBeNull())
  expect(window.location.hash).toBe('#/reunioes')
  expect(falso.reunioes.map((reuniao) => reuniao.id)).toEqual(['r1', 'r2', 'r3', 'r5'])
  expect(falso.historico.map((evento) => evento.acao)).toEqual(['excluir'])
})

test('a falha ao excluir mostra a mensagem em vermelho e a reunião continua', async () => {
  const falso = await abrirAJanela()
  falso.falhaDeGravacao = 'sem rede'
  confirmar()
  const aviso = await painel().findByRole('alert')
  expect(aviso.textContent).toBe('A alteração não foi salva: sem rede.')
  expect(aviso.className).toContain('cadastros-falha')
  expect(falso.reunioes).toHaveLength(5)
  expect(screen.getByRole('button', { name: '01/10/2026' })).toBeTruthy()
})

test('a recusa do banco aparece com a frase pronta', async () => {
  const falso = await abrirAJanela()
  falso.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar as reuniões.')
  confirmar()
  expect((await painel().findByRole('alert')).textContent).toBe('Seu perfil não permite alterar as reuniões.')
  expect(falso.reunioes).toHaveLength(5)
})

test('excluir uma reunião que outra pessoa já excluiu mostra o aviso e a lista deixa de mostrá-la', async () => {
  const falso = await abrirAJanela()
  falso.reunioes = falso.reunioes.filter((reuniao) => reuniao.id !== 'r4')
  confirmar()
  expect(await screen.findByText('Esta reunião não existe mais. Ela pode ter sido excluída.')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('button', { name: '01/10/2026' })).toBeNull())
})
