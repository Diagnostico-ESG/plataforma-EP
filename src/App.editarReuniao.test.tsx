import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
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

const painel = () => within(screen.getByRole('complementary', { name: 'Painel da reunião' }))

// A reunião r4 (modelagem do TSA, 01/10/2026, com os processos p2 e p1) é a padrão: a lista mostra a data no botão da linha.
async function abrirOFormulario(montagem: Parameters<typeof montarReunioes>[0] = {}, botao = '01/10/2026') {
  const falso = montarReunioes(montagem)
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: botao }))
  fireEvent.click(await painel().findByRole('button', { name: 'Editar' }))
  const formulario = within(await screen.findByRole('form', { name: 'Editar reunião' }))
  await formulario.findByRole('option', { name: 'TSA — Setor A' })
  return { falso, formulario }
}

type Formulario = Awaited<ReturnType<typeof abrirOFormulario>>['formulario']

const salvar = (formulario: Formulario) => formulario.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement
const campo = (formulario: Formulario, rotulo: string) =>
  formulario.getByLabelText(rotulo) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

test('Editar abre o formulário preenchido com os dados da reunião', async () => {
  const { formulario } = await abrirOFormulario()
  expect((formulario.getByLabelText('Modelagem') as HTMLInputElement).checked).toBe(true)
  expect(campo(formulario, 'Setor').value).toBe('s1')
  expect(campo(formulario, 'Data').value).toBe('2026-10-01')
  expect(campo(formulario, 'Hora (opcional)').value).toBe('')
  expect(campo(formulario, 'Local').value).toBe('Link da chamada')
  expect(campo(formulario, 'Anotações').value).toBe('Ficou combinado revisar o fluxo.\nPrazo na sexta.')
  expect((await formulario.findByLabelText('Emitir Ofício') as HTMLInputElement).checked).toBe(true)
  expect((formulario.getByLabelText('Arquivar Pasta (cancelado)') as HTMLInputElement).checked).toBe(true)
  expect(salvar(formulario).disabled).toBe(false)
})

test('trocar o setor ou passar para sensibilização desmarca os processos que já não cabem', async () => {
  const { formulario } = await abrirOFormulario()
  fireEvent.change(campo(formulario, 'Setor'), { target: { value: 's2' } })
  expect((await formulario.findByLabelText('Pagar Diária') as HTMLInputElement).checked).toBe(false)
  expect(formulario.queryByLabelText('Emitir Ofício')).toBeNull()
  expect(salvar(formulario).disabled).toBe(true)
  fireEvent.change(campo(formulario, 'Setor'), { target: { value: 's1' } })
  expect((await formulario.findByLabelText('Emitir Ofício') as HTMLInputElement).checked).toBe(false)
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  expect(formulario.queryByText('Processos tratados')).toBeNull()
  expect(salvar(formulario).disabled).toBe(false)
})

test('salvar grava pelo id, volta aos dados já atualizados e a lista de trás reflete a mudança', async () => {
  const { falso, formulario } = await abrirOFormulario()
  fireEvent.change(campo(formulario, 'Data'), { target: { value: '2026-11-30' } })
  fireEvent.change(campo(formulario, 'Local'), { target: { value: ' Sala 3 ' } })
  fireEvent.click(salvar(formulario))
  await waitFor(() => expect(screen.queryByRole('form', { name: 'Editar reunião' })).toBeNull())
  expect(falso.gravacoes).toEqual([{ id: 'r4', dados: {
    tipo: 'modelagem', setorId: 's1', data: '2026-11-30', hora: null, local: 'Sala 3',
    anotacoes: 'Ficou combinado revisar o fluxo.\nPrazo na sexta.', processosIds: ['p2', 'p1'], usuariosIds: [], responsaveisIds: [], outrosParticipantes: [],
  } }])
  const dados = within(await painel().findByRole('region', { name: 'Dados da reunião' }))
  expect(await dados.findByText('30/11/2026')).toBeTruthy()
  expect(dados.getByText('Sala 3')).toBeTruthy()
  expect(await screen.findByRole('button', { name: '30/11/2026' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: '01/10/2026' })).toBeNull()
  expect(window.location.hash).toBe('#/reunioes/r4')
})

test('trocar para sensibilização e salvar tira os processos da reunião', async () => {
  const { falso, formulario } = await abrirOFormulario()
  fireEvent.click(formulario.getByLabelText('Sensibilização'))
  fireEvent.click(salvar(formulario))
  await waitFor(() => expect(falso.gravacoes).toHaveLength(1))
  expect(falso.gravacoes[0].dados).toMatchObject({ tipo: 'sensibilizacao', processosIds: [] })
  expect(await painel().findByText('Sensibilização')).toBeTruthy()
  expect(painel().queryByText('Processos')).toBeNull()
})

test('Cancelar volta aos dados sem gravar', async () => {
  const { falso, formulario } = await abrirOFormulario()
  fireEvent.change(campo(formulario, 'Local'), { target: { value: 'Outra sala' } })
  fireEvent.click(formulario.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('form', { name: 'Editar reunião' })).toBeNull()
  expect(painel().getByText('Link da chamada')).toBeTruthy()
  expect(falso.gravacoes).toEqual([])
})

test('reunião em setor que ficou inativo abre com o setor marcado "(inativo)" e salva sem trocá-lo', async () => {
  const doSetorInativo = reuniao('r9', '2026-09-05', { setorId: 's3', setorSigla: 'TSC', setorAtivo: false })
  const falso = montarReunioes({ reunioes: [doSetorInativo] })
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '05/09/2026' }))
  fireEvent.click(await painel().findByRole('button', { name: 'Editar' }))
  const formulario = within(await screen.findByRole('form', { name: 'Editar reunião' }))
  await formulario.findByRole('option', { name: 'TSA — Setor A' })
  expect(formulario.getAllByRole('option').map((opcao) => opcao.textContent))
    .toEqual(['Escolha o setor', 'TSA — Setor A', 'TSB — Setor B', 'TSC (inativo)'])
  expect(campo(formulario, 'Setor').value).toBe('s3')
  fireEvent.click(salvar(formulario))
  await waitFor(() => expect(falso.gravacoes).toHaveLength(1))
  expect(falso.gravacoes[0].dados.setorId).toBe('s3')
})

test('a falha ao gravar mostra a mensagem em vermelho e mantém o que foi alterado', async () => {
  const { falso, formulario } = await abrirOFormulario({ ajustar: (f) => { f.falhaDeGravacao = 'sem rede' } })
  fireEvent.change(campo(formulario, 'Local'), { target: { value: 'Sala 9' } })
  fireEvent.click(salvar(formulario))
  const alerta = await formulario.findByRole('alert')
  expect(alerta.textContent).toBe('A alteração não foi salva: sem rede. Seus dados continuam no formulário.')
  expect(alerta.className).toContain('cadastros-falha')
  expect(campo(formulario, 'Local').value).toBe('Sala 9')
  expect(falso.gravacoes).toEqual([])
})

test('a recusa do banco aparece com a frase pronta e o formulário continua aberto', async () => {
  const frase = 'O processo Pagar Diária não é do setor da reunião.'
  const { formulario } = await abrirOFormulario({ ajustar: (f) => { f.falhaDeGravacao = new TravaDoBanco(frase) } })
  fireEvent.change(campo(formulario, 'Local'), { target: { value: 'Sala 9' } })
  fireEvent.click(salvar(formulario))
  expect((await formulario.findByRole('alert')).textContent).toBe(frase)
  expect(campo(formulario, 'Local').value).toBe('Sala 9')
})

test('reunião excluída por outra pessoa durante a edição: o painel avisa e a lista deixa de mostrá-la', async () => {
  const { falso, formulario } = await abrirOFormulario()
  falso.reunioes = falso.reunioes.filter((r) => r.id !== 'r4')
  fireEvent.click(salvar(formulario))
  expect(await screen.findByText('Esta reunião não existe mais. Ela pode ter sido excluída.')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('button', { name: '01/10/2026' })).toBeNull())
  fireEvent.click(painel().getByRole('button', { name: 'Voltar' }))
  await waitFor(() => expect(window.location.hash).toBe('#/reunioes'))
})

test('a Consulta não vê Editar nem Excluir', async () => {
  montarReunioes({ perfil: 'consulta' })
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  await painel().findByText('Reunião de modelagem')
  expect(painel().queryByRole('button', { name: 'Editar' })).toBeNull()
  expect(painel().queryByRole('button', { name: 'Excluir' })).toBeNull()
})
