import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { ProcessosFalso } from './processos/ProcessosFalso'
import { abrirCatalogo, linhasDoCatalogo, montarComCatalogo } from './testes/catalogoDeTeste'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const nomesEmOrdem = (processos: ProcessosFalso) => [...processos.catalogo.etapas].sort((a, b) => a.ordem - b.ordem).map((e) => e.nome)

function janelaAberta() {
  return within(screen.getByRole('dialog'))
}

test('Editar muda nome e obrigatória', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Publicação' }))
  const formulario = within(secao.getByRole('form', { name: 'Editar etapa' }))
  expect((formulario.getByLabelText('Nome') as HTMLInputElement).value).toBe('Publicação')
  expect(formulario.queryByLabelText('Código')).toBeNull()
  fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: 'Publicação final' } })
  fireEvent.click(formulario.getByLabelText('Obrigatória'))
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(processos.catalogo.etapas[2]).toMatchObject({ nome: 'Publicação final', obrigatoria: true }))
  expect((await linhasDoCatalogo(secao))[2]).toMatch(/^Publicação finalProcessoObrigatória/)
})

test('falha ao editar mostra o motivo no formulário', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Publicação' }))
  processos.catalogo.falhaDeGravacao = 'sem conexão'
  const formulario = within(secao.getByRole('form', { name: 'Editar etapa' }))
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  expect((await formulario.findByRole('alert')).textContent)
    .toBe('A alteração não foi salva: sem conexão. Seus dados continuam no formulário.')
})

test('Subir e Descer trocam a etapa com a vizinha', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Subir Publicação' }))
  await waitFor(() => expect(nomesEmOrdem(processos)[1]).toBe('Publicação'))
  fireEvent.click(await secao.findByRole('button', { name: 'Descer Reunião de modelagem' }))
  await waitFor(() => expect(nomesEmOrdem(processos)).toEqual([
    'Identificação dos processos', 'Publicação', 'Arquivamento', 'Reunião de modelagem',
  ]))
  await waitFor(async () => expect((await linhasDoCatalogo(secao))[3]).toMatch(/^Reunião de modelagem/))
})

test('a recusa ao mover aparece em vermelho, ao lado da lista', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Subir Reunião de modelagem' }))
  expect((await secao.findByRole('alert')).textContent).toBe('As etapas do setor precisam vir antes das etapas do processo.')
})

test('Subir fica desabilitado na primeira etapa e Descer na última', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  expect((await secao.findByRole('button', { name: 'Subir Identificação dos processos' })).hasAttribute('disabled')).toBe(true)
  expect(secao.getByRole('button', { name: 'Descer Arquivamento' }).hasAttribute('disabled')).toBe(true)
})

test('Desativar e Reativar trocam a pílula Inativa', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Publicação' }))
  await waitFor(async () => expect((await linhasDoCatalogo(secao))[2]).toMatch(/^PublicaçãoInativa/))
  fireEvent.click(secao.getByRole('button', { name: 'Reativar Arquivamento' }))
  await waitFor(async () => expect((await linhasDoCatalogo(secao))[3]).toMatch(/^ArquivamentoProcesso/))
})

test('falha ao desativar mostra o motivo e não muda a lista', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  processos.catalogo.falhaDeGravacao = 'sem conexão'
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Publicação' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(processos.catalogo.etapas[2].ativa).toBe(true)
})

test('Excluir pede confirmação com o nome da etapa e exclui a nunca usada', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Arquivamento' }))
  expect(janelaAberta().getByRole('heading').textContent).toBe('Excluir a etapa Arquivamento do catálogo?')
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir etapa' }))
  await waitFor(() => expect(processos.catalogo.etapas).toHaveLength(3))
  await waitFor(async () => expect(await linhasDoCatalogo(secao)).toHaveLength(3))
})

test('Cancelar na confirmação não exclui', async () => {
  const processos = montarComCatalogo()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Arquivamento' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(processos.catalogo.etapas).toHaveLength(4)
})

test('excluir etapa já usada é recusado, sugerindo desativar', async () => {
  montarComCatalogo({ ajustar: (processos) => {
    processos.etapasDoSetor = { s1: [{
      id: 'a1', codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3, obrigatoria: true,
      status: 'concluida', nota: null, iniciadaEm: '2026-10-01', resolvidaEm: '2026-10-02',
    }] }
  } })
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Identificação dos processos' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir etapa' }))
  expect((await secao.findByRole('alert')).textContent)
    .toBe('A etapa Identificação dos processos já foi usada; desative-a em vez de excluir.')
})
