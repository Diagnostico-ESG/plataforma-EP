import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fixarOHoje, linhasDasReunioes, montarReunioes, reuniao } from './testes/reunioesDeTeste'

beforeEach(() => {
  window.location.hash = '#/reunioes'
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

type Montagem = Parameters<typeof montarReunioes>[0]

const painel = () => within(screen.getByRole('complementary', { name: 'Painel da reunião' }))

// A reunião do TSA com a Ana e o Caio (que ficou inativo), a Dani e dois outros participantes.
const COM_GENTE = reuniao('r9', '2026-10-02', {
  usuarios: [{ id: 'u1', nome: 'Ana Teste', ativo: true }, { id: 'u3', nome: 'Caio Teste', ativo: false }],
  responsaveis: [{ id: 'x1', nome: 'Dani Teste' }],
  outrosParticipantes: ['Gil Externo', 'Hilda Externa'],
})
const SEM_GENTE = reuniao('r8', '2026-10-03')

async function abrirOPainel(botao: string, montagem: Montagem = {}) {
  const falso = montarReunioes({ reunioes: [COM_GENTE, SEM_GENTE], ...montagem })
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: botao }))
  await screen.findByRole('complementary', { name: 'Painel da reunião' })
  return falso
}

const dados = () => within(painel().getByRole('region', { name: 'Dados da reunião' }))
const valorDe = (rotulo: string) => dados().getByText(rotulo).nextElementSibling as HTMLElement
const nomesDe = (rotulo: string) => within(valorDe(rotulo)).getAllByRole('listitem').map((item) => item.textContent)

test('o painel mostra as três listas de participantes', async () => {
  await abrirOPainel('02/10/2026')
  await dados().findByText('Usuários do EP')
  expect(nomesDe('Usuários do EP')).toEqual(['Ana Teste', 'Caio Teste Inativo'])
  expect(nomesDe('Responsáveis do setor')).toEqual(['Dani Teste'])
  expect(nomesDe('Outros participantes')).toEqual(['Gil Externo', 'Hilda Externa'])
})

test('lista sem ninguém aparece como traço', async () => {
  await abrirOPainel('03/10/2026')
  await dados().findByText('Usuários do EP')
  for (const rotulo of ['Usuários do EP', 'Responsáveis do setor', 'Outros participantes']) {
    expect(valorDe(rotulo).textContent).toBe('—')
  }
})

test('só o usuário que deixou de estar ativo leva a pílula Inativo', async () => {
  await abrirOPainel('02/10/2026')
  await dados().findByText('Usuários do EP')
  const itens = within(valorDe('Usuários do EP')).getAllByRole('listitem')
  expect(within(itens[0]).queryByText('Inativo')).toBeNull()
  expect(within(itens[1]).getByText('Inativo')).toBeTruthy()
})

test('a Consulta vê as três listas, sem botões de alteração nem campos editáveis', async () => {
  await abrirOPainel('02/10/2026', { perfil: 'consulta' })
  await dados().findByText('Usuários do EP')
  expect(nomesDe('Responsáveis do setor')).toEqual(['Dani Teste'])
  expect(painel().queryByRole('button', { name: 'Editar' })).toBeNull()
  expect(painel().queryByRole('button', { name: 'Excluir' })).toBeNull()
  expect(painel().queryByRole('checkbox')).toBeNull()
  expect(painel().queryByRole('textbox')).toBeNull()
})

test('o responsável excluído do setor continua na reunião, como outro participante com o nome que tinha', async () => {
  await abrirOPainel('02/10/2026', { ajustar: (falso) => falso.excluirResponsavelDoSetor('x1') })
  await dados().findByText('Usuários do EP')
  expect(valorDe('Responsáveis do setor').textContent).toBe('—')
  expect(nomesDe('Outros participantes')).toEqual(['Gil Externo', 'Hilda Externa', 'Dani Teste'])
})

test('a aba Histórico mostra só o que mudou quando um usuário é marcado na edição', async () => {
  await abrirOPainel('03/10/2026')
  fireEvent.click(await painel().findByRole('button', { name: 'Editar' }))
  const formulario = within(await screen.findByRole('form', { name: 'Editar reunião' }))
  fireEvent.click(await formulario.findByLabelText('Ana Teste'))
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(screen.queryByRole('form', { name: 'Editar reunião' })).toBeNull())
  fireEvent.click(await painel().findByRole('tab', { name: 'Histórico' }))
  const itens = await painel().findAllByRole('listitem')
  expect(itens).toHaveLength(1)
  expect(within(itens[0]).getByText('Editou')).toBeTruthy()
  expect(within(itens[0]).getByText('Antes: Usuários do EP: nenhum')).toBeTruthy()
  expect(within(itens[0]).getByText('Depois: Usuários do EP: Ana Teste')).toBeTruthy()
})
