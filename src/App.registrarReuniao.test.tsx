import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
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

async function abrirOFormulario(montagem: Parameters<typeof montarReunioes>[0] = {}) {
  const falso = montarReunioes(montagem)
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: 'Registrar reunião' }))
  const formulario = await screen.findByRole('form', { name: 'Registrar reunião' })
  await within(formulario).findByRole('option', { name: 'TSA — Setor A' })
  return { falso, formulario: within(formulario) }
}

type Formulario = Awaited<ReturnType<typeof abrirOFormulario>>['formulario']

const salvar = (formulario: Formulario) => formulario.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement
const escolherSetor = (formulario: Formulario, id: string) =>
  fireEvent.change(formulario.getByLabelText('Setor'), { target: { value: id } })
const preencherData = (formulario: Formulario, data = '2026-11-20') =>
  fireEvent.change(formulario.getByLabelText('Data'), { target: { value: data } })

test('salvar fica desabilitado enquanto falta tipo, setor, data ou, na modelagem, processo', async () => {
  const { formulario } = await abrirOFormulario()
  expect(salvar(formulario).disabled).toBe(true)
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  escolherSetor(formulario, 's1')
  expect(salvar(formulario).disabled).toBe(true)
  preencherData(formulario)
  expect(salvar(formulario).disabled).toBe(false)
  fireEvent.click(formulario.getByLabelText('Modelagem'))
  expect(salvar(formulario).disabled).toBe(true)
  fireEvent.click(await formulario.findByLabelText('Emitir Ofício'))
  expect(salvar(formulario).disabled).toBe(false)
})

test('a escolha do setor traz só os setores ativos', async () => {
  const { formulario } = await abrirOFormulario()
  const opcoes = formulario.getAllByRole('option').map((opcao) => opcao.textContent)
  expect(opcoes).toEqual(['Escolha o setor', 'TSA — Setor A', 'TSB — Setor B'])
})

test('registra uma sensibilização sem processos; hora, local e anotações vazios viram nulos', async () => {
  const { falso, formulario } = await abrirOFormulario()
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  escolherSetor(formulario, 's1')
  preencherData(formulario)
  expect(formulario.queryByText('Processos tratados')).toBeNull()
  fireEvent.click(salvar(formulario))
  await waitFor(() => expect(screen.queryByRole('form', { name: 'Registrar reunião' })).toBeNull())
  expect(falso.gravacoes).toEqual([{
    id: null,
    dados: { tipo: 'sensibilizacao', setorId: 's1', data: '2026-11-20', hora: null, local: null, anotacoes: null, processosIds: [],
      outrosParticipantes: [] },
  }])
  expect(await screen.findByText('20/11/2026')).toBeTruthy()
  expect(window.location.hash).toBe('#/reunioes')
})

test('registra uma modelagem com vários processos do setor, inclusive o cancelado, com hora, local e anotações', async () => {
  const { falso, formulario } = await abrirOFormulario()
  fireEvent.click(formulario.getByLabelText('Modelagem'))
  escolherSetor(formulario, 's1')
  expect((await formulario.findAllByRole('checkbox')).map((caixa) => caixa.parentElement?.textContent))
    .toEqual(['Emitir Ofício', 'Arquivar Pasta (cancelado)'])
  fireEvent.click(formulario.getByLabelText('Emitir Ofício'))
  fireEvent.click(formulario.getByLabelText('Arquivar Pasta (cancelado)'))
  preencherData(formulario)
  fireEvent.change(formulario.getByLabelText('Hora (opcional)'), { target: { value: '14:30' } })
  fireEvent.change(formulario.getByLabelText('Local'), { target: { value: ' Sala 2 ' } })
  fireEvent.change(formulario.getByLabelText('Anotações'), { target: { value: 'Mapeamos o fluxo.' } })
  fireEvent.click(salvar(formulario))
  await waitFor(() => expect(falso.gravacoes).toHaveLength(1))
  expect(falso.gravacoes[0].dados).toEqual({
    tipo: 'modelagem', setorId: 's1', data: '2026-11-20', hora: '14:30', local: 'Sala 2', anotacoes: 'Mapeamos o fluxo.',
    processosIds: ['p1', 'p2'], outrosParticipantes: [],
  })
  expect(await screen.findByText('20/11/2026 14:30')).toBeTruthy()
})

test('trocar o setor ou passar para sensibilização desmarca os processos que já não cabem', async () => {
  const { formulario } = await abrirOFormulario()
  fireEvent.click(formulario.getByLabelText('Modelagem'))
  escolherSetor(formulario, 's1')
  fireEvent.click(await formulario.findByLabelText('Emitir Ofício'))
  escolherSetor(formulario, 's2')
  expect((await formulario.findByLabelText('Pagar Diária') as HTMLInputElement).checked).toBe(false)
  expect(formulario.queryByLabelText('Emitir Ofício')).toBeNull()
  fireEvent.click(formulario.getByLabelText('Pagar Diária'))
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  expect(formulario.queryByText('Processos tratados')).toBeNull()
  fireEvent.click(formulario.getByLabelText('Modelagem'))
  expect((await formulario.findByLabelText('Pagar Diária') as HTMLInputElement).checked).toBe(false)
})

test('a falha ao gravar mostra a mensagem em vermelho e mantém o que foi preenchido', async () => {
  const { falso, formulario } = await abrirOFormulario({ ajustar: (f) => { f.falhaDeGravacao = 'sem rede' } })
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  escolherSetor(formulario, 's2')
  preencherData(formulario)
  fireEvent.change(formulario.getByLabelText('Local'), { target: { value: 'Sala 9' } })
  fireEvent.click(salvar(formulario))
  const alerta = await formulario.findByRole('alert')
  expect(alerta.textContent).toBe('A alteração não foi salva: sem rede. Seus dados continuam no formulário.')
  expect(alerta.className).toContain('cadastros-falha')
  expect((formulario.getByLabelText('Local') as HTMLInputElement).value).toBe('Sala 9')
  expect((formulario.getByLabelText('Setor') as HTMLSelectElement).value).toBe('s2')
  expect(falso.gravacoes).toEqual([])
})

test('cada recusa do banco aparece com a frase pronta, sem perder o preenchido', async () => {
  const recusas = [
    'O setor TSA está inativo; escolha um setor ativo.',
    'O processo Emitir Ofício não é do setor da reunião.',
    'A reunião de modelagem precisa de ao menos um processo.',
    'A reunião de sensibilização não tem processos.',
    'O local pode ter no máximo 300 caracteres. Recebido: 301.',
  ]
  for (const frase of recusas) {
    const { falso, formulario } = await abrirOFormulario({ ajustar: (f) => { f.falhaDeGravacao = new TravaDoBanco(frase) } })
    fireEvent.click(formulario.getByLabelText('Sensibilização'))
    escolherSetor(formulario, 's1')
    preencherData(formulario)
    fireEvent.click(salvar(formulario))
    expect((await formulario.findByRole('alert')).textContent).toBe(frase)
    expect((formulario.getByLabelText('Data') as HTMLInputElement).value).toBe('2026-11-20')
    expect(falso.gravacoes).toEqual([])
    cleanup()
  }
})

test('Cancelar e Esc fecham o formulário sem gravar', async () => {
  const { falso, formulario } = await abrirOFormulario()
  fireEvent.click(formulario.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('form', { name: 'Registrar reunião' })).toBeNull())
  expect(window.location.hash).toBe('#/reunioes')
  fireEvent.click(screen.getByRole('button', { name: 'Registrar reunião' }))
  fireEvent.keyDown(await screen.findByRole('form', { name: 'Registrar reunião' }), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('form', { name: 'Registrar reunião' })).toBeNull())
  expect(falso.gravacoes).toEqual([])
})

test('a falha ao carregar os setores do formulário mostra o erro com Tentar de novo', async () => {
  const falso = montarReunioes()
  await linhasDasReunioes()
  falso.falharOpcoes = true
  fireEvent.click(screen.getByRole('button', { name: 'Registrar reunião' }))
  expect(await screen.findByText('Não foi possível carregar os setores. Verifique a conexão e tente de novo.')).toBeTruthy()
  falso.falharOpcoes = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('option', { name: 'TSA — Setor A' })).toBeTruthy()
})

test('a Consulta não abre o formulário nem pelo endereço', async () => {
  window.location.hash = '#/reunioes/nova'
  montarReunioes({ perfil: 'consulta' })
  await linhasDasReunioes()
  expect(screen.queryByRole('form', { name: 'Registrar reunião' })).toBeNull()
})
