import { cleanup, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { abrirEdicao, cadastrar, escrever, formulario, montar, preencher } from './testes/cadastroDeProcesso'
import { blocoDasAnotacoes, campoDasAnotacoes } from './testes/anotacoesNoVerso'

beforeEach(() => {
  window.location.hash = '#/processos/novo'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

test('o cadastro tem o campo Anotações (até 8.000 caracteres) e o Editar não tem', async () => {
  montar()
  const campo = (await formulario()).getByLabelText('Anotações') as HTMLTextAreaElement
  expect(campo.tagName).toBe('TEXTAREA')
  expect(campo.getAttribute('maxlength')).toBe('8000')
  cleanup()
  expect((await abrirEdicao()).form.queryByLabelText('Anotações')).toBeNull()
})

test('as Anotações do cadastro aparecem no bloco do verso, com quem escreveu e quando', async () => {
  const falso = montar()
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício', setor: 's1', macro: 'm1' })
  escrever(form.getByLabelText('Anotações'), 'Combinado com o setor')
  cadastrar(form)
  await screen.findByRole('dialog', { name: 'Processo Emitir Ofício' })
  expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Combinado com o setor')
  expect(await (await blocoDasAnotacoes()).findByText(`Alterado por ${USUARIO_DE_TESTE.nome} em 13/10, 14:30`)).toBeTruthy()
  expect(falso.anotacoes.porProcesso[falso.processos[0].id].texto).toBe('Combinado com o setor')
})

test('Anotações em branco ou só com espaços vão como nulas, e o cadastro funciona sem elas', async () => {
  const falso = montar()
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício', setor: 's1', macro: 'm1' })
  escrever(form.getByLabelText('Anotações'), '  \n ')
  cadastrar(form)
  await waitFor(() => expect(falso.processos).toHaveLength(1))
  expect(falso.anotacoes.porProcesso[falso.processos[0].id]).toBeUndefined()
})

test('a recusa some ao mudar qualquer campo e volta ao enviar de novo se o problema continua', async () => {
  const falso = montar()
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício' })
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toBe('Escolha o setor do processo.')
  preencher(form, { setor: 's1' })
  expect(form.queryByRole('alert')).toBeNull()
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toBe('Escolha o macroprocesso do processo.')
  escrever(form.getByLabelText('Anotações'), 'qualquer')
  expect(form.queryByRole('alert')).toBeNull()
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toBe('Escolha o macroprocesso do processo.')
  expect(falso.processos).toEqual([])
})

test('a recusa do banco também some ao mudar um campo e volta ao enviar de novo', async () => {
  const falso = montar()
  falso.falhaDeGravacao = 'sem conexão'
  const form = await formulario()
  preencher(form, { nome: 'Emitir Ofício', setor: 's1', macro: 'm1' })
  cadastrar(form)
  await form.findByRole('alert')
  preencher(form, { nome: 'Emitir Ofício 2' })
  expect(form.queryByRole('alert')).toBeNull()
  cadastrar(form)
  expect((await form.findByRole('alert')).textContent).toContain('sem conexão')
})

