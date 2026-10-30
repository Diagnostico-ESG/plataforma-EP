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

function preencherNova(secao: Secao, campos: { nome?: string; codigo?: string; posicao?: string; fase?: string }) {
  fireEvent.click(secao.getByRole('button', { name: 'Nova etapa' }))
  const formulario = within(secao.getByRole('form', { name: 'Nova etapa' }))
  if (campos.nome !== undefined) fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: campos.nome } })
  if (campos.codigo !== undefined) fireEvent.change(formulario.getByLabelText('Código'), { target: { value: campos.codigo } })
  if (campos.posicao !== undefined) fireEvent.change(formulario.getByLabelText('Posição'), { target: { value: campos.posicao } })
  if (campos.fase !== undefined) fireEvent.change(formulario.getByLabelText('Fase do Regimento'), { target: { value: campos.fase } })
  return formulario
}

test('o administrador vê as abas Usuários e Catálogo de etapas, com Usuários aberta', async () => {
  montarComCatalogo()
  await irParaAdministracao()
  expect((await screen.findByRole('tab', { name: 'Usuários' })).getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('tab', { name: 'Catálogo de etapas' }).getAttribute('aria-selected')).toBe('false')
  expect(screen.getByRole('heading', { name: 'Usuários' })).toBeTruthy()
})

test('a lista mostra as etapas em ordem, com a fase e a situação; as duas fixas levam o selo Fixa, sem botões e sem fase', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  expect(await linhasDoCatalogo(secao)).toEqual([
    'Não iniciados—AtivaFixa',
    expect.stringMatching(/^Modelagem pilotoIVAtiva/),
    expect.stringMatching(/^Relatório e modelagem técnicaVAtiva/),
    expect.stringMatching(/^DivulgaçãoVIIAtiva/),
    expect.stringMatching(/^ArquivamentoVIIInativa/),
    'Concluídos—AtivaFixa',
  ])
  expect(secao.queryByRole('columnheader', { name: 'Nível' })).toBeNull()
  expect(secao.queryByRole('columnheader', { name: 'Obrigatória' })).toBeNull()
  expect(secao.getByRole('button', { name: 'Reativar Arquivamento' })).toBeTruthy()
  expect(secao.getByRole('button', { name: 'Desativar Divulgação' })).toBeTruthy()
  for (const nome of ['Não iniciados', 'Concluídos']) {
    const linha = secao.getByText(nome, { selector: 'td' }).closest('tr') as HTMLElement
    // O botão sem nome é o da caixa do responsável inicial (BotaoDaCaixa); os de ação levam aria-label.
    expect(within(linha).queryAllByRole('button').filter((botao) => botao.hasAttribute('aria-label'))).toEqual([])
    expect(within(linha).getByText('Fixa')).toBeTruthy()
  }
})

test('Subir e Descer não atravessam as fixas: a primeira etapa de trabalho não sobe e a última não desce', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  expect((secao.getByRole('button', { name: 'Subir Modelagem piloto' }) as HTMLButtonElement).disabled).toBe(true)
  expect((secao.getByRole('button', { name: 'Descer Modelagem piloto' }) as HTMLButtonElement).disabled).toBe(false)
  expect((secao.getByRole('button', { name: 'Descer Arquivamento' }) as HTMLButtonElement).disabled).toBe(true)
  expect((secao.getByRole('button', { name: 'Subir Arquivamento' }) as HTMLButtonElement).disabled).toBe(false)
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
  expect(await linhasDoCatalogo(secao)).toHaveLength(6)
})

test('Nova etapa antes de outra entra na posição escolhida', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Revisão técnica', codigo: 'revisao_tecnica', posicao: 'e9', fase: 'VI' })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Nova etapa' })).toBeNull())
  expect((await linhasDoCatalogo(secao))[3]).toMatch(/^Revisão técnicaVIAtiva/)
})

test('Nova etapa vai logo antes de Concluídos por padrão, sem os campos "Nível" e "Obrigatória"', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento', fase: 'VIII' })
  expect(formulario.queryByLabelText('Nível')).toBeNull()
  expect(formulario.queryByLabelText('Obrigatória')).toBeNull()
  expect((formulario.getByLabelText('Posição') as HTMLSelectElement).value).toBe('')
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(processos.catalogo.etapas).toHaveLength(7))
  expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'encerramento')).toEqual({
    id: expect.any(String), codigo: 'encerramento', nome: 'Encerramento', fase: 'VIII', ordem: 8, ativa: true,
  })
  expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'concluidos')?.ordem).toBe(9)
})

test('código fora do formato é recusado na tela, com o valor recebido, sem gravar', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Revisão', codigo: 'Revisão' })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect(formulario.getByRole('alert').textContent).toBe(
    'O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "Revisão".')
  expect(processos.catalogo.etapas).toHaveLength(6)
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
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento', fase: 'VI' })
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
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento', fase: 'VI' })
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
  expect(processos.catalogo.etapas).toHaveLength(6)
})

test('o formulário de nova etapa não oferece Não iniciados nem Concluídos como posição', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, {})
  const opcoes = Array.from((formulario.getByLabelText('Posição') as HTMLSelectElement).options).map((opcao) => opcao.textContent)
  expect(opcoes).toEqual(['No fim, antes de Concluídos', 'Antes de Modelagem piloto', 'Antes de Relatório e modelagem técnica', 'Antes de Divulgação', 'Antes de Arquivamento'])
})

test('a tabela tem a coluna Fase', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  expect(await secao.findByRole('columnheader', { name: 'Fase' })).toBeTruthy()
})

test('sem fase, o formulário recusa com a frase e não perde o preenchido', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, { nome: 'Encerramento', codigo: 'encerramento' })
  expect((formulario.getByLabelText('Fase do Regimento') as HTMLSelectElement).value).toBe('')
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect(formulario.getByRole('alert').textContent).toBe('Escolha a fase do Regimento.')
  expect((formulario.getByLabelText('Nome') as HTMLInputElement).value).toBe('Encerramento')
  expect(processos.catalogo.etapas).toHaveLength(6)
})

test('o formulário oferece as fases IV a IX', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  await secao.findAllByRole('row')
  const formulario = preencherNova(secao, {})
  const opcoes = Array.from((formulario.getByLabelText('Fase do Regimento') as HTMLSelectElement).options).map((o) => o.value)
  expect(opcoes).toEqual(['', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'])
})
