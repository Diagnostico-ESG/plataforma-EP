import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { falhaDoAndamento } from './processos/andamentosSupabase'
import { RECUSAS_DOS_PROCESSOS } from './processos/processosSupabase'
import { montarNosCadastros } from './testes/reunioesNosCadastros'
import { BPMN_VALIDO, PNG_VALIDO } from './testes/versoesDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const painelAberto = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))

test('a versão enviada aparece no histórico do processo, com texto próprio', async () => {
  montarNosCadastros()
  const painel = await painelAberto()
  const secao = within(await painel.findByRole('region', { name: 'Versões do processo' }))
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar versão' }))
  fireEvent.change(form.getByLabelText('Fluxograma (.bpmn)'), { target: { files: [BPMN_VALIDO] } })
  fireEvent.change(form.getByLabelText('Imagem do fluxograma (.png)'), { target: { files: [PNG_VALIDO] } })
  const enviar = form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
  await waitFor(() => expect(enviar.disabled).toBe(false))
  fireEvent.click(enviar)
  await secao.findByRole('listitem', { name: 'V1' })
  fireEvent.click(painel.getByRole('tab', { name: 'Histórico' }))
  const evento = await painel.findByText('Enviou a versão')
  expect(evento.parentElement?.textContent).toBe('Enviou a versão V1 — Emitir Ofício')
  expect(painel.getByText(/Arquivos: TSA_V1_Emitir Ofício.bpmn, TSA_V1_Emitir Ofício.png/)).toBeTruthy()
})

test('a versão histórica registrada aparece no histórico do processo, com texto próprio', async () => {
  montarNosCadastros()
  const painel = await painelAberto()
  const secao = within(await painel.findByRole('region', { name: 'Versões do processo' }))
  fireEvent.click(await secao.findByRole('button', { name: 'Registrar versão histórica' }))
  const form = within(await secao.findByRole('form', { name: 'Registrar versão histórica' }))
  fireEvent.change(form.getByLabelText('Número da versão'), { target: { value: '5' } })
  fireEvent.change(form.getByLabelText('Arquivo do Bizagi (.bpm) (opcional)'), { target: { files: [new File(['b'], 'fonte.bpm')] } })
  const registrar = form.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement
  await waitFor(() => expect(registrar.disabled).toBe(false))
  fireEvent.click(registrar)
  await secao.findByRole('listitem', { name: 'V5F' })
  fireEvent.click(painel.getByRole('tab', { name: 'Histórico' }))
  const evento = await painel.findByText('Registrou a versão histórica')
  expect(evento.parentElement?.textContent).toBe('Registrou a versão histórica V5F — Emitir Ofício')
  expect(painel.getByText(/Arquivos: TSA_V5F_Emitir Ofício.bpm/)).toBeTruthy()
})

// A recusa que o banco devolveria (migração versoes), traduzida pelo módulo real: a tela mostra o que ele produziria.
test('excluir processo com versões mostra em vermelho a contagem e o caminho (cancelar), e o processo continua', async () => {
  const { processos } = montarNosCadastros()
  const painel = await painelAberto()
  fireEvent.click(await painel.findByRole('button', { name: 'Excluir' }))
  processos.falhaDeGravacao = falhaDoAndamento({ code: 'P0001', message: 'processo_com_versoes:2' }, RECUSAS_DOS_PROCESSOS)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  expect((await painel.findByRole('alert')).textContent)
    .toBe('Não é possível excluir: processo tem 2 versões enviadas. Cancele o processo em vez de excluí-lo.')
  expect(processos.processos.map((processo) => processo.id)).toContain('p1')
})
