import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { recusaDeProcessos } from './cadastros/recusasDeProcessos'
import { falhaDoAndamento } from './processos/andamentosSupabase'
import { RECUSAS_DOS_PROCESSOS } from './processos/processosSupabase'
import { fixarOHoje } from './testes/reunioesDeTeste'
import { montarNosCadastros } from './testes/reunioesNosCadastros'

beforeEach(() => {
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

// A recusa que o banco devolveria (migração reunioes), traduzida pelo módulo real: a tela mostra o que ele produziria.
test('excluir setor com reuniões mostra em vermelho a contagem e o caminho (desativar), e o setor continua', async () => {
  window.location.hash = '#/setores/s1'
  const { cadastros } = montarNosCadastros()
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  cadastros.falhaDeGravacao = recusaDeProcessos({ code: 'P0001', message: 'setor_com_reunioes:2' })
  fireEvent.click(screen.getByRole('button', { name: 'Excluir setor' }))
  expect((await screen.findByRole('alert')).textContent)
    .toBe('Não é possível excluir: setor tem 2 reuniões registradas. Desative o setor em vez de excluí-lo.')
  expect(cadastros.setores.map((setor) => setor.id)).toContain('s1')
})

test('excluir processo tratado em reunião mostra em vermelho a contagem e o caminho (cancelar), e o processo continua', async () => {
  window.location.hash = '#/processos/p1'
  const { processos } = montarNosCadastros()
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  fireEvent.click(await painel.findByRole('button', { name: 'Excluir' }))
  processos.falhaDeGravacao = falhaDoAndamento({ code: 'P0001', message: 'processo_com_reunioes:1' }, RECUSAS_DOS_PROCESSOS)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  expect((await painel.findByRole('alert')).textContent)
    .toBe('Não é possível excluir: processo foi tratado em 1 reunião. Cancele o processo em vez de excluí-lo.')
  expect(processos.processos.map((processo) => processo.id)).toContain('p1')
})
