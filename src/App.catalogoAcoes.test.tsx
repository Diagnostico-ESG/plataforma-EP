import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { ProcessosFalso } from './processos/ProcessosFalso'
import { umProcessoLido } from './testes/processoDaLista'
import { abrirCatalogo, linhasDoCatalogo, montarComCatalogo } from './testes/catalogoDeTeste'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const nomesEmOrdem = (processos: ProcessosFalso) => [...processos.catalogo.etapas].sort((a, b) => a.ordem - b.ordem).map((e) => e.nome)

function janelaAberta() {
  return within(screen.getByRole('dialog'))
}

test('Editar muda nome e fase, sem o campo obrigatória', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Divulgação' }))
  const formulario = within(secao.getByRole('form', { name: 'Editar etapa' }))
  expect((formulario.getByLabelText('Nome') as HTMLInputElement).value).toBe('Divulgação')
  expect(formulario.queryByLabelText('Código')).toBeNull()
  expect(formulario.queryByLabelText('Obrigatória')).toBeNull()
  expect((formulario.getByLabelText('Fase do Regimento') as HTMLSelectElement).value).toBe('VII')
  fireEvent.change(formulario.getByLabelText('Fase do Regimento'), { target: { value: 'IX' } })
  fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: 'Divulgação final' } })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'divulgacao')).toMatchObject({ nome: 'Divulgação final', fase: 'IX' }))
  expect((await linhasDoCatalogo(secao))[3]).toMatch(/^Divulgação finalIXAtiva/)
})

test('falha ao editar mostra o motivo no formulário', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Divulgação' }))
  processos.catalogo.falhaDeGravacao = 'sem conexão'
  const formulario = within(secao.getByRole('form', { name: 'Editar etapa' }))
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect((await formulario.findByRole('alert')).textContent)
    .toBe('A alteração não foi salva: sem conexão. Seus dados continuam no formulário.')
})

test('Subir e Descer trocam a etapa com a vizinha, sem atravessar as fixas', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Subir Divulgação' }))
  await waitFor(() => expect(nomesEmOrdem(processos)[2]).toBe('Divulgação'))
  fireEvent.click(await secao.findByRole('button', { name: 'Descer Relatório e modelagem técnica' }))
  await waitFor(() => expect(nomesEmOrdem(processos)).toEqual([
    'Não iniciados', 'Modelagem piloto', 'Divulgação', 'Arquivamento', 'Relatório e modelagem técnica', 'Concluídos',
  ]))
  await waitFor(async () => expect((await linhasDoCatalogo(secao))[4]).toMatch(/^Relatório e modelagem técnica/))
})

test('a recusa ao mover aparece em vermelho, ao lado da lista', async () => {
  montarComCatalogo({ ajustar: (processos) => {
    processos.catalogo.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  } })
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Subir Relatório e modelagem técnica' }))
  expect((await secao.findByRole('alert')).textContent).toBe('Seu perfil não permite alterar os processos.')
})

test('Subir fica desabilitado na primeira etapa de trabalho e Descer na última', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  expect((await secao.findByRole('button', { name: 'Subir Modelagem piloto' })).hasAttribute('disabled')).toBe(true)
  expect(secao.getByRole('button', { name: 'Descer Arquivamento' }).hasAttribute('disabled')).toBe(true)
})

test('Desativar e Reativar trocam a situação', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Divulgação' }))
  await waitFor(async () => expect((await linhasDoCatalogo(secao))[3]).toMatch(/^DivulgaçãoVIIInativa/))
  fireEvent.click(secao.getByRole('button', { name: 'Reativar Arquivamento' }))
  await waitFor(async () => expect((await linhasDoCatalogo(secao))[4]).toMatch(/^ArquivamentoVIIAtiva/))
})

test('falha ao desativar mostra o motivo e não muda a lista', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  processos.catalogo.falhaDeGravacao = 'sem conexão'
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Divulgação' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'divulgacao')?.ativa).toBe(true)
})

test('Excluir pede confirmação com o nome da etapa e exclui a nunca usada', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Arquivamento' }))
  expect(janelaAberta().getByRole('heading').textContent).toBe('Excluir a etapa Arquivamento do catálogo?')
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir etapa' }))
  await waitFor(() => expect(processos.catalogo.etapas).toHaveLength(5))
  await waitFor(async () => expect(await linhasDoCatalogo(secao)).toHaveLength(5))
})

test('Cancelar na confirmação não exclui', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Arquivamento' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(processos.catalogo.etapas).toHaveLength(6)
})

// ---- Etapa com processo dentro e etapa por onde um processo passou

const DIVULGACAO = { id: 'e9', codigo: 'divulgacao', nome: 'Divulgação', ordem: 6, posicao: 4, total: 5 }
const processoNaDivulgacao = (id: string) => umProcessoLido(`Processo ${id}`, { id, etapaAtual: DIVULGACAO })

test('desativar e excluir a etapa com processo dentro são recusados, com a contagem', async () => {
  const processos = montarComCatalogo({ ajustar: (falso) => { falso.processos = [processoNaDivulgacao('a'), processoNaDivulgacao('b')] } })
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Divulgação' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A etapa Divulgação tem 2 processos; mova-os antes de desativar.')
  fireEvent.click(secao.getByRole('button', { name: 'Excluir Divulgação' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir etapa' }))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('A etapa Divulgação tem 2 processos; mova-os antes de excluir.'))
  expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'divulgacao')?.ativa).toBe(true)
})

test('excluir a etapa por onde um processo passou é recusado, sugerindo desativar; desativar vale', async () => {
  const visitada = umProcessoLido('Visitou', {
    id: 'v', etapaAtual: { id: 'e1', codigo: 'nao_iniciados', nome: 'Não iniciados', ordem: 1, posicao: 1, total: 5 },
    etapasDoVerso: [{ id: 'e9', codigo: 'divulgacao', nome: 'Divulgação', ordem: 6, passagens: [{ entrouEm: '2026-10-01', saiuEm: '2026-10-02' }] }],
  })
  const processos = montarComCatalogo({ ajustar: (falso) => { falso.processos = [visitada] } })
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Divulgação' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir etapa' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A etapa Divulgação já recebeu processos; desative-a em vez de excluir.')
  fireEvent.click(secao.getByRole('button', { name: 'Desativar Divulgação' }))
  await waitFor(() => expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'divulgacao')?.ativa).toBe(false))
})

// ---- As seis etapas com campos próprios não saem do catálogo (revisoes-aprovacao, ticket 01, história 26, ampliada)

const FRASE_DA_PROTEGIDA = (nome: string) => `A etapa ${nome} tem campos próprios e não pode ser desativada nem excluída.`

test.each(['Modelagem piloto', 'Relatório e modelagem técnica'])('desativar a %s é recusado com a frase, e a etapa continua ativa', async (nome) => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: `Desativar ${nome}` }))
  expect((await secao.findByRole('alert')).textContent).toBe(FRASE_DA_PROTEGIDA(nome))
  expect(processos.catalogo.etapas.find((etapa) => etapa.nome === nome)?.ativa).toBe(true)
})

test('excluir a Modelagem piloto é recusado com a frase, e a etapa continua no catálogo', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Modelagem piloto' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir etapa' }))
  expect((await secao.findByRole('alert')).textContent).toBe(FRASE_DA_PROTEGIDA('Modelagem piloto'))
  expect(processos.catalogo.etapas.some((etapa) => etapa.codigo === 'modelagem')).toBe(true)
})

test('renomear a Modelagem piloto continua aceito', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Modelagem piloto' }))
  const formulario = within(secao.getByRole('form', { name: 'Editar etapa' }))
  fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: 'Modelagem inicial' } })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'modelagem')?.nome).toBe('Modelagem inicial'))
})
