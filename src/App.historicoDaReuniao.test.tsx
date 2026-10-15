import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { EventoDoCadastro } from './cadastros/tipos'
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

const painel = () => within(screen.getByRole('complementary', { name: 'Painel da reunião' }))

const ESTADO = {
  tipo: 'modelagem', setor_id: 's1', setor_sigla: 'TSA', data: '2026-10-01', hora: null, local: 'Sala 1', anotacoes: null,
  outros_participantes: [], processos: [{ id: 'p1', nome: 'Emitir Ofício' }],
}

function evento(id: number, parcial: Partial<EventoDoCadastro>): EventoDoCadastro {
  return {
    id, ocorridoEm: '2026-10-01T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'criar', entidade: 'reuniao', entidadeRef: 'r4',
    antes: null, depois: ESTADO, ...parcial,
  }
}

const EVENTOS = [
  evento(1, {}),
  evento(2, { acao: 'editar', ocorridoEm: '2026-10-02T15:00:00Z', antes: ESTADO, depois: { ...ESTADO, local: 'Link da chamada' } }),
]

async function abrirOHistorico(montagem: Parameters<typeof montarReunioes>[0] = {}) {
  const falso = montarReunioes(montagem)
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  fireEvent.click(await painel().findByRole('tab', { name: 'Histórico' }))
  return falso
}

test('a aba Histórico lista a criação e a alteração, do mais recente para o mais antigo, com autor e o que mudou', async () => {
  await abrirOHistorico({ ajustar: (f) => { f.historico = EVENTOS } })
  const itens = await painel().findAllByRole('listitem')
  expect(itens).toHaveLength(2)
  expect(within(itens[0]).getByText('Editou')).toBeTruthy()
  expect(within(itens[0]).getByText('Pessoa Fictícia')).toBeTruthy()
  expect(within(itens[0]).getByText('Antes: Local: Sala 1')).toBeTruthy()
  expect(within(itens[0]).getByText('Depois: Local: Link da chamada')).toBeTruthy()
  expect(within(itens[1]).getByText('Criou')).toBeTruthy()
  expect(within(itens[1]).getByText('Antes: —')).toBeTruthy()
  expect(within(itens[1]).getByText(/^Depois: Tipo: Modelagem; Setor: TSA; Data: 01\/10\/2026/)).toBeTruthy()
})

test('só os eventos da reunião aberta aparecem', async () => {
  await abrirOHistorico({ ajustar: (f) => { f.historico = [...EVENTOS, evento(3, { entidadeRef: 'r1' })] } })
  expect(await painel().findAllByRole('listitem')).toHaveLength(2)
})

test('editar a reunião acrescenta a alteração ao histórico; salvar sem mudar nada não acrescenta', async () => {
  const falso = montarReunioes()
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  for (const local of ['Link da chamada', 'Sala 5']) {
    fireEvent.click(await painel().findByRole('button', { name: 'Editar' }))
    const formulario = within(await screen.findByRole('form', { name: 'Editar reunião' }))
    await formulario.findByRole('option', { name: 'TSA — Setor A' })
    fireEvent.change(formulario.getByLabelText('Local'), { target: { value: local } })
    fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
    await painel().findByRole('button', { name: 'Editar' })
  }
  expect(falso.historico.map((evento) => evento.acao)).toEqual(['editar'])
  fireEvent.click(painel().getByRole('tab', { name: 'Histórico' }))
  const item = (await painel().findAllByRole('listitem'))[0]
  expect(within(item).getByText('Antes: Local: Link da chamada')).toBeTruthy()
  expect(within(item).getByText('Depois: Local: Sala 5')).toBeTruthy()
})

test('sem eventos mostra "Nenhuma alteração registrada ainda."', async () => {
  await abrirOHistorico()
  expect(await painel().findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
})

test('enquanto lê mostra o aviso; se a leitura falha, o erro tem Tentar de novo', async () => {
  await abrirOHistorico({ ajustar: (f) => { f.segurarHistoricoDaReuniao = true } })
  expect(await painel().findByText('Carregando histórico…')).toBeTruthy()
  cleanup()
  const falso = await abrirOHistorico({ ajustar: (f) => { f.falharHistoricoDaReuniao = true; f.historico = EVENTOS } })
  expect(await painel().findByText('Não foi possível carregar o histórico. Verifique a conexão e tente de novo.')).toBeTruthy()
  falso.falharHistoricoDaReuniao = false
  fireEvent.click(painel().getByRole('button', { name: 'Tentar de novo' }))
  expect(await painel().findAllByRole('listitem')).toHaveLength(2)
})

test('a Consulta também vê o histórico, sem nenhum botão de alteração', async () => {
  await abrirOHistorico({ perfil: 'consulta', ajustar: (f) => { f.historico = EVENTOS } })
  expect(await painel().findAllByRole('listitem')).toHaveLength(2)
  expect(painel().getAllByRole('button').map((botao) => botao.getAttribute('aria-label'))).toEqual(['Fechar o painel'])
})
