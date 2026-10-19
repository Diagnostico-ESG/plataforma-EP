import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { EventoDoCadastro } from './cadastros/tipos'
import { montarNosCadastros } from './testes/processosNosCadastros'

// Recursos que saíram da plataforma (ADR 0013): a área Reuniões (reunioes, ticket 05; sobra só a data no processo) e
// os responsáveis do setor (processos-etapas, ticket 11) e as etapas do setor (processos-etapas, ticket 12).
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const REUNIAO_ANTIGA: EventoDoCadastro = {
  id: 9, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'criar', entidade: 'reuniao', entidadeRef: 'r1',
  antes: null, depois: { tipo: 'modelagem', data: '2026-10-14', setor_sigla: 'TSA', local: 'Sala 1' },
}

const RESPONSAVEL_ANTIGO: EventoDoCadastro = {
  id: 10, ocorridoEm: '2026-10-13T16:00:00Z', autor: 'Pessoa Fictícia', acao: 'criar', entidade: 'responsavel_do_setor',
  entidadeRef: 's1:r1', antes: null, depois: { setor_id: 's1', setor_sigla: 'TSA', nome: 'Ana Teste', email: null, cargo: 'Chefe' },
}

const ETAPA_DO_SETOR_ANTIGA: EventoDoCadastro = {
  id: 11, ocorridoEm: '2026-10-13T17:00:00Z', autor: 'Pessoa Fictícia', acao: 'dispensar', entidade: 'andamento',
  entidadeRef: 's1:a1', antes: { setor_id: 's1', setor_sigla: 'TSA', etapa_nome: 'Reunião de sensibilização', status: 'pendente' },
  depois: { setor_id: 's1', setor_sigla: 'TSA', etapa_nome: 'Reunião de sensibilização', status: 'dispensada' },
  motivo: 'Setor já conhecido',
}

test('a faixa lateral não tem mais o item Reuniões', async () => {
  montarNosCadastros()
  const faixa = within(await screen.findByRole('navigation', { name: 'Áreas do sistema' }))
  expect(faixa.queryByRole('button', { name: 'Reuniões' })).toBeNull()
})

test.each(['#/reunioes', '#/reunioes/r1'])('o endereço antigo %s abre o Quadro', async (endereco) => {
  window.location.hash = endereco
  montarNosCadastros()
  expect(await screen.findByRole('region', { name: 'Processos' })).toBeTruthy()
  const faixa = within(screen.getByRole('navigation', { name: 'Áreas do sistema' }))
  expect(faixa.getByRole('button', { name: 'Quadro' }).getAttribute('aria-current')).toBe('page')
})

test('o setor aberto não tem a seção de reuniões', async () => {
  window.location.hash = '#/setores'
  montarNosCadastros()
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  await screen.findByRole('region', { name: 'Processos do setor' })
  expect(screen.queryByText('Reuniões')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})

test('o painel do processo não tem a seção de reuniões', async () => {
  window.location.hash = '#/processos/p1'
  montarNosCadastros()
  await screen.findByRole('dialog', { name: /^Processo( |$)/ })
  await screen.findByRole('region', { name: 'Dados do processo' })
  expect(screen.queryByText('Reuniões')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})

test('no histórico geral, o registro antigo de reunião aparece numa linha simples, fora do filtro', async () => {
  window.location.hash = '#/setores/historico'
  montarNosCadastros({ ajustarCadastros: (cadastros) => { cadastros.historico = [REUNIAO_ANTIGA] } })
  const filtro = await screen.findByRole('combobox', { name: 'Item' })
  const [item] = screen.getAllByRole('listitem')
  expect(item.textContent).toContain('Criou Registro de reunião (recurso retirado da plataforma)')
  expect(within(item).getByText('Pessoa Fictícia')).toBeTruthy()
  expect(item.textContent).toMatch(/13\/10\/2026/)
  expect(item.textContent).not.toContain('Antes:')
  expect(item.textContent).not.toContain('Depois:')
  expect(within(filtro).getAllByRole('option').map((opcao) => opcao.textContent)).toEqual(['Todos os itens'])
})

test('no histórico geral, o registro antigo de responsável do setor aparece numa linha simples, fora do filtro', async () => {
  window.location.hash = '#/setores/historico'
  montarNosCadastros({ ajustarCadastros: (cadastros) => { cadastros.historico = [RESPONSAVEL_ANTIGO] } })
  const filtro = await screen.findByRole('combobox', { name: 'Item' })
  const [item] = screen.getAllByRole('listitem')
  expect(item.textContent).toContain('Criou Registro de responsável do setor (recurso retirado da plataforma)')
  expect(within(item).getByText('Pessoa Fictícia')).toBeTruthy()
  expect(item.textContent).toMatch(/13\/10\/2026/)
  expect(item.textContent).not.toContain('Ana Teste')
  expect(item.textContent).not.toContain('Antes:')
  expect(within(filtro).getAllByRole('option').map((opcao) => opcao.textContent)).toEqual(['Todos os itens'])
})

test.each(['integrante_ep', 'consulta'] as const)('o setor aberto não tem a seção de responsáveis do setor (%s)', async (perfil) => {
  window.location.hash = '#/setores'
  montarNosCadastros({ perfil })
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  await screen.findByRole('region', { name: 'Processos do setor' })
  expect(screen.queryByText('Responsáveis do setor')).toBeNull()
  expect(screen.queryByText('Carregando responsáveis…')).toBeNull()
  expect(screen.queryByRole('button', { name: /responsável/i })).toBeNull()
})

test('o setor aberto não tem a seção de etapas do setor, para quem altera e para a Consulta', async () => {
  for (const perfil of ['integrante_ep', 'consulta'] as const) {
    window.location.hash = '#/setores'
    montarNosCadastros({ perfil })
    fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
    await screen.findByRole('region', { name: 'Processos do setor' })
    expect(screen.queryByRole('region', { name: 'Etapas do setor' })).toBeNull()
    expect(screen.queryByText('Carregando etapas do setor…')).toBeNull()
    cleanup()
  }
})

test('no histórico geral, o registro antigo de etapa do setor aparece numa linha simples e segue no filtro do setor', async () => {
  window.location.hash = '#/setores/historico'
  montarNosCadastros({ ajustarCadastros: (cadastros) => { cadastros.historico = [ETAPA_DO_SETOR_ANTIGA] } })
  const filtro = await screen.findByRole('combobox', { name: 'Item' })
  const [item] = screen.getAllByRole('listitem')
  expect(item.textContent).toContain('Dispensou a etapa Registro de etapa do setor (recurso retirado da plataforma)')
  expect(within(item).getByText('Pessoa Fictícia')).toBeTruthy()
  expect(item.textContent).toMatch(/13\/10\/2026/)
  expect(item.textContent).not.toContain('Reunião de sensibilização')
  expect(item.textContent).not.toContain('Antes:')
  expect(item.textContent).not.toContain('Setor já conhecido')
  fireEvent.change(filtro, { target: { value: 's1' } })
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})
