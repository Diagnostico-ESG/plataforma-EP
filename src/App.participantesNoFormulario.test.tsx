import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { RESPONSAVEIS_DE_TESTE, fixarOHoje, linhasDasReunioes, montarReunioes, reuniao } from './testes/reunioesDeTeste'

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

async function abrirONovo(montagem: Montagem = {}) {
  const falso = montarReunioes(montagem)
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: 'Registrar reunião' }))
  const formulario = within(await screen.findByRole('form', { name: 'Registrar reunião' }))
  await formulario.findByRole('option', { name: 'TSA — Setor A' })
  return { falso, formulario }
}

// A reunião do TSA com a Ana e o Caio (que ficou inativo), a Dani e dois outros participantes.
const REUNIAO_COM_GENTE = reuniao('r9', '2026-10-02', {
  usuarios: [{ id: 'u1', nome: 'Ana Teste', ativo: true }, { id: 'u3', nome: 'Caio Teste', ativo: false }],
  responsaveis: [{ id: 'x1', nome: 'Dani Teste' }],
  outrosParticipantes: ['Gil Externo', 'Hilda Externa'],
})

async function abrirAEdicao(montagem: Montagem = {}) {
  const falso = montarReunioes({ reunioes: [REUNIAO_COM_GENTE], ...montagem })
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '02/10/2026' }))
  fireEvent.click(await painel().findByRole('button', { name: 'Editar' }))
  const formulario = within(await screen.findByRole('form', { name: 'Editar reunião' }))
  await formulario.findByRole('option', { name: 'TSA — Setor A' })
  return { falso, formulario }
}

type Formulario = Awaited<ReturnType<typeof abrirONovo>>['formulario']

const escolherSetor = (formulario: Formulario, id: string) =>
  fireEvent.change(formulario.getByLabelText('Setor'), { target: { value: id } })
const salvar = (formulario: Formulario) => fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
const marcada = (formulario: Formulario, rotulo: string) => (formulario.getByLabelText(rotulo) as HTMLInputElement).checked
const outros = (formulario: Formulario) => formulario.getByLabelText('Outros participantes') as HTMLTextAreaElement
const nomesDoGrupo = (grupo: HTMLElement) =>
  within(grupo).getAllByRole('checkbox').map((caixa) => caixa.parentElement?.textContent)

test('o formulário novo mostra os usuários ativos, os responsáveis só depois do setor e a área de outros participantes', async () => {
  const { formulario } = await abrirONovo()
  expect(nomesDoGrupo(await formulario.findByRole('group', { name: 'Usuários do EP' }))).toEqual(['Ana Teste', 'Bia Teste'])
  expect(formulario.queryByRole('group', { name: 'Responsáveis do setor' })).toBeNull()
  escolherSetor(formulario, 's1')
  expect(nomesDoGrupo(await formulario.findByRole('group', { name: 'Responsáveis do setor' }))).toEqual(['Dani Teste', 'Edu Teste'])
  expect(outros(formulario).value).toBe('')
  expect(formulario.getByText('Um nome por linha.')).toBeTruthy()
})

test('setor sem responsáveis cadastrados avisa em vez de mostrar uma lista vazia', async () => {
  const { formulario } = await abrirONovo({ ajustar: (falso) => { falso.responsaveisDosSetores = { ...RESPONSAVEIS_DE_TESTE, s2: [] } } })
  escolherSetor(formulario, 's2')
  expect(await formulario.findByText('Este setor ainda não tem responsáveis.')).toBeTruthy()
  expect(formulario.queryByRole('group', { name: 'Responsáveis do setor' })).toBeNull()
})

test('registra com usuários, responsável e outros participantes; os outros saem um por linha, aparados e sem linhas vazias', async () => {
  const { falso, formulario } = await abrirONovo()
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  escolherSetor(formulario, 's1')
  fireEvent.change(formulario.getByLabelText('Data'), { target: { value: '2026-11-20' } })
  fireEvent.click(formulario.getByLabelText('Ana Teste'))
  fireEvent.click(formulario.getByLabelText('Bia Teste'))
  fireEvent.click(await formulario.findByLabelText('Dani Teste'))
  fireEvent.change(outros(formulario), { target: { value: '  Gil Externo  \n\n Hilda Externa' } })
  salvar(formulario)
  await waitFor(() => expect(falso.gravacoes).toHaveLength(1))
  expect(falso.gravacoes[0].dados).toMatchObject({
    usuariosIds: ['u1', 'u2'], responsaveisIds: ['x1'], outrosParticipantes: ['Gil Externo', 'Hilda Externa'],
  })
})

test('trocar o setor desmarca os responsáveis e mantém os usuários marcados', async () => {
  const { formulario } = await abrirONovo()
  escolherSetor(formulario, 's1')
  fireEvent.click(await formulario.findByLabelText('Dani Teste'))
  fireEvent.click(formulario.getByLabelText('Ana Teste'))
  escolherSetor(formulario, 's2')
  expect(await formulario.findByLabelText('Fabi Teste')).toBeTruthy()
  expect(marcada(formulario, 'Fabi Teste')).toBe(false)
  expect(marcada(formulario, 'Ana Teste')).toBe(true)
  escolherSetor(formulario, 's1')
  expect((await formulario.findByLabelText('Dani Teste') as HTMLInputElement).checked).toBe(false)
})

test('editar abre com os participantes marcados e escritos, inclusive o usuário que ficou inativo', async () => {
  const { falso, formulario } = await abrirAEdicao()
  expect(marcada(formulario, 'Ana Teste')).toBe(true)
  expect(marcada(formulario, 'Caio Teste (inativo)')).toBe(true)
  expect(marcada(formulario, 'Bia Teste')).toBe(false)
  expect((await formulario.findByLabelText('Dani Teste') as HTMLInputElement).checked).toBe(true)
  expect(marcada(formulario, 'Edu Teste')).toBe(false)
  expect(outros(formulario).value).toBe('Gil Externo\nHilda Externa')
  fireEvent.click(formulario.getByLabelText('Caio Teste (inativo)'))
  fireEvent.click(formulario.getByLabelText('Bia Teste'))
  fireEvent.click(formulario.getByLabelText('Dani Teste'))
  fireEvent.click(formulario.getByLabelText('Edu Teste'))
  salvar(formulario)
  await waitFor(() => expect(falso.gravacoes).toHaveLength(1))
  expect(falso.gravacoes[0].dados).toMatchObject({
    usuariosIds: ['u1', 'u2'], responsaveisIds: ['x2'], outrosParticipantes: ['Gil Externo', 'Hilda Externa'],
  })
})

test('salvar a edição sem mexer nos participantes devolve os mesmos', async () => {
  const { falso, formulario } = await abrirAEdicao()
  await formulario.findByLabelText('Dani Teste')
  salvar(formulario)
  await waitFor(() => expect(falso.gravacoes).toHaveLength(1))
  expect(falso.gravacoes[0].dados).toMatchObject({
    usuariosIds: ['u1', 'u3'], responsaveisIds: ['x1'], outrosParticipantes: ['Gil Externo', 'Hilda Externa'],
  })
})

test('a recusa por responsável de outro setor aparece em vermelho e o formulário continua como estava', async () => {
  const frase = 'O responsável Olga Teste não é do setor da reunião.'
  const { formulario } = await abrirAEdicao({ ajustar: (falso) => { falso.falhaDeGravacao = new TravaDoBanco(frase) } })
  await formulario.findByLabelText('Dani Teste')
  salvar(formulario)
  const alerta = await formulario.findByRole('alert')
  expect(alerta.textContent).toBe(frase)
  expect(alerta.className).toContain('cadastros-falha')
  expect(marcada(formulario, 'Dani Teste')).toBe(true)
  expect(outros(formulario).value).toBe('Gil Externo\nHilda Externa')
})

test('outro participante com mais de 200 caracteres é recusado com o tamanho recebido, sem perder o escrito', async () => {
  const { falso, formulario } = await abrirAEdicao()
  await formulario.findByLabelText('Dani Teste')
  fireEvent.change(outros(formulario), { target: { value: 'x'.repeat(201) } })
  salvar(formulario)
  expect((await formulario.findByRole('alert')).textContent)
    .toBe('Cada outro participante pode ter no máximo 200 caracteres. Recebido: 201.')
  expect(outros(formulario).value).toBe('x'.repeat(201))
  expect(falso.gravacoes).toEqual([])
})

test('a lista de usuários que não carrega mostra o erro com Tentar de novo, e carrega depois', async () => {
  const { falso, formulario } = await abrirONovo({ ajustar: (f) => { f.falharUsuarios = true } })
  expect(await formulario.findByText('Não foi possível carregar os usuários. Verifique a conexão e tente de novo.')).toBeTruthy()
  falso.falharUsuarios = false
  fireEvent.click(formulario.getByRole('button', { name: 'Tentar de novo' }))
  expect(nomesDoGrupo(await formulario.findByRole('group', { name: 'Usuários do EP' }))).toEqual(['Ana Teste', 'Bia Teste'])
})

test('a lista de responsáveis que não carrega mostra o erro com Tentar de novo, e carrega depois', async () => {
  const { falso, formulario } = await abrirONovo({ ajustar: (f) => { f.falharResponsaveis = true } })
  escolherSetor(formulario, 's1')
  expect(await formulario.findByText('Não foi possível carregar os responsáveis do setor. Verifique a conexão e tente de novo.'))
    .toBeTruthy()
  falso.falharResponsaveis = false
  fireEvent.click(formulario.getByRole('button', { name: 'Tentar de novo' }))
  expect(nomesDoGrupo(await formulario.findByRole('group', { name: 'Responsáveis do setor' }))).toEqual(['Dani Teste', 'Edu Teste'])
})

test('enquanto as listas carregam, o formulário avisa', async () => {
  const { formulario } = await abrirONovo({ ajustar: (f) => { f.segurarUsuarios = true; f.segurarResponsaveis = true } })
  expect(formulario.getByText('Carregando usuários…')).toBeTruthy()
  escolherSetor(formulario, 's1')
  expect(await formulario.findByText('Carregando responsáveis…')).toBeTruthy()
})
