import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { abrirCatalogo, irParaAdministracao, linhasDoCatalogo, montarComCatalogo } from './testes/catalogoDeTeste'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

type Secao = ReturnType<typeof within>

function preencherNova(secao: Secao, campos: { nome?: string; codigo?: string; posicao?: string; obrigatoria?: boolean }) {
  fireEvent.click(secao.getByRole('button', { name: 'Nova etapa' }))
  const formulario = within(secao.getByRole('form', { name: 'Nova etapa' }))
  if (campos.nome !== undefined) fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: campos.nome } })
  if (campos.codigo !== undefined) fireEvent.change(formulario.getByLabelText('Código'), { target: { value: campos.codigo } })
  if (campos.posicao !== undefined) fireEvent.change(formulario.getByLabelText('Posição'), { target: { value: campos.posicao } })
  if (campos.obrigatoria) fireEvent.click(formulario.getByLabelText('Obrigatória'))
  return formulario
}

test('o administrador vê as abas Usuários e Catálogo de etapas, com Usuários aberta', async () => {
  montarComCatalogo()
  await irParaAdministracao()
  expect((await screen.findByRole('tab', { name: 'Usuários' })).getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('tab', { name: 'Catálogo de etapas' }).getAttribute('aria-selected')).toBe('false')
  expect(screen.getByRole('heading', { name: 'Usuários' })).toBeTruthy()
})

test('a lista mostra as etapas em ordem, com obrigatória ou opcional e a pílula Inativa, sem a coluna "Nível"', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  expect(await linhasDoCatalogo(secao)).toEqual([
    expect.stringMatching(/^Modelagem pilotoObrigatória/),
    expect.stringMatching(/^Relatório e modelagem técnicaObrigatória/),
    expect.stringMatching(/^PublicaçãoOpcional/),
    expect.stringMatching(/^ArquivamentoInativaOpcional/),
  ])
  expect(secao.queryByRole('columnheader', { name: 'Nível' })).toBeNull()
  expect(secao.getByRole('button', { name: 'Reativar Arquivamento' })).toBeTruthy()
  expect(secao.getByRole('button', { name: 'Desativar Publicação' })).toBeTruthy()
})

test.each<Perfil>(['integrante_ep', 'consulta'])('o perfil %s não vê a aba do catálogo', async (perfil) => {
  window.location.hash = '#/administracao'
  montarComCatalogo({ perfil })
  expect(await screen.findByText(/não permite administrar usuários/)).toBeTruthy()
  expect(screen.queryByRole('tab', { name: 'Catálogo de etapas' })).toBeNull()
})

test('enquanto carrega, mostra "Carregando catálogo…"', async () => {
  montarComCatalogo({ ajustar: (processos) => { processos.catalogo.segurarLeitura = true } })
  const secao = await abrirCatalogo()
  expect(secao.getByText('Carregando catálogo…')).toBeTruthy()
})

test('falha ao carregar mostra o erro e Tentar de novo recarrega', async () => {
  const processos = montarComCatalogo({ ajustar: (falso) => { falso.catalogo.falharLeitura = true } })
  const secao = await abrirCatalogo()
  expect(await secao.findByText('Não foi possível carregar o catálogo. Verifique a conexão e tente de novo.')).toBeTruthy()
  processos.catalogo.falharLeitura = false
  fireEvent.click(secao.getByRole('button', { name: 'Tentar de novo' }))
  expect(await linhasDoCatalogo(secao)).toHaveLength(4)
})

test('Nova etapa antes de outra entra na posição escolhida', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Revisão técnica', codigo: 'revisao_tecnica', posicao: 'e9', obrigatoria: true })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Nova etapa' })).toBeNull())
  expect((await linhasDoCatalogo(secao))[2]).toMatch(/^Revisão técnicaObrigatória/)
})

test('Nova etapa vai para o fim por padrão, sem o campo "Nível"', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento' })
  expect(formulario.queryByLabelText('Nível')).toBeNull()
  expect((formulario.getByLabelText('Posição') as HTMLSelectElement).value).toBe('')
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(processos.catalogo.etapas).toHaveLength(5))
  expect(processos.catalogo.etapas.at(-1)).toEqual({
    id: expect.any(String), codigo: 'encerramento', nome: 'Encerramento', obrigatoria: false, ordem: 8, ativa: true,
  })
})

test('código fora do formato é recusado na tela, com o valor recebido, sem gravar', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Revisão', codigo: 'Revisão' })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect(formulario.getByRole('alert').textContent).toBe(
    'O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "Revisão".')
  expect(processos.catalogo.etapas).toHaveLength(4)
})

test('nome em branco é recusado na tela', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: '  ', codigo: 'nova' })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect(formulario.getByRole('alert').textContent).toBe('O nome da etapa é obrigatório.')
})

test('falha ao gravar mostra o motivo e mantém os dados no formulário', async () => {
  montarComCatalogo({ ajustar: (processos) => { processos.catalogo.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento' })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect((await formulario.findByRole('alert')).textContent)
    .toBe('A alteração não foi salva: sem conexão. Seus dados continuam no formulário.')
  expect((formulario.getByLabelText('Nome') as HTMLInputElement).value).toBe('Encerramento')
})

test('a recusa pronta do banco aparece como veio', async () => {
  montarComCatalogo({ ajustar: (processos) => {
    processos.catalogo.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  } })
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento' })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect((await formulario.findByRole('alert')).textContent).toBe('Seu perfil não permite alterar os processos.')
})

test('Cancelar fecha o formulário sem gravar', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento' })
  fireEvent.click(formulario.getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: 'Nova etapa' })).toBeNull()
  expect(processos.catalogo.etapas).toHaveLength(4)
})
