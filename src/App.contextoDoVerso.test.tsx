import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { ProcessoLido } from './processos/tipos'
import { etapaDoProcesso, montarVerso, processoLido } from './testes/processoNoVerso'
import { versoAberto } from './testes/versoDoCartao'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ETAPAS = [
  etapaDoProcesso(1, 'modelagem', 'Modelagem piloto', { status: 'concluida', iniciadaEm: '2026-10-01', resolvidaEm: '2026-10-02' }),
  etapaDoProcesso(2, 'revisao_interna', 'Revisão interna', { status: 'em_andamento', iniciadaEm: '2026-10-03' }),
]

const regiao = async (nome: string) => within(await (await versoAberto()).findByRole('region', { name: nome }))

// Sobre

test('Sobre mostra setor, macroprocesso, tipo, origem e contexto, e omite o campo vazio', async () => {
  montarVerso(processoLido(ETAPAS, { contexto: 'Ofícios do setor fictício', observacoes: null }))
  const sobre = await regiao('Sobre')
  expect(sobre.getAllByRole('term').map((rotulo) => rotulo.textContent)).toEqual(['Setor', 'Macroprocesso', 'Tipo', 'Origem', 'Contexto'])
  expect(sobre.getByText('TSA')).toBeTruthy()
  expect(sobre.getByText('Macro de Teste')).toBeTruthy()
  expect(sobre.getByText('Processo')).toBeTruthy()
  expect(sobre.getByText('Novo')).toBeTruthy()
  expect(sobre.getByText('Ofícios do setor fictício')).toBeTruthy()
  expect(sobre.queryByText('Observações')).toBeNull()
  expect(sobre.queryByRole('button')).toBeNull()
})

test('texto longo mostra [Ler mais], que vira [Ler menos]', async () => {
  montarVerso(processoLido(ETAPAS, { observacoes: 'Observação inventada. '.repeat(15) }))
  const sobre = await regiao('Sobre')
  const botao = sobre.getByRole('button', { name: 'Ler mais' })
  expect(botao.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(botao)
  expect(sobre.getByRole('button', { name: 'Ler menos' }).getAttribute('aria-expanded')).toBe('true')
})

// Estrutura

function subprocesso(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return processoLido(ETAPAS, { id, nome, tipo: 'subprocesso', processoPaiId: 'p1', ...mudancas })
}

test('Subprocessos ({n}) com a etapa atual de cada um e a situação fora de em andamento', async () => {
  montarVerso(processoLido(ETAPAS), 'integrante_ep', [
    subprocesso('p2', 'Conferir Ofício'),
    subprocesso('p3', 'Arquivar Ofício', { situacao: 'suspenso', motivoDaSituacao: 'Motivo inventado' }),
    subprocesso('p4', 'Publicar Ofício', { situacao: 'concluido', etapaAtual: null }),
  ])
  const estrutura = await regiao('Subprocessos (3)')
  const itens = estrutura.getAllByRole('listitem').map((item) => item.textContent)
  expect(itens).toEqual([
    'Arquivar OfícioRevisão interna · Suspenso', 'Conferir OfícioRevisão interna', 'Publicar OfícioConcluído',
  ])
})

test('o link do subprocesso abre o subprocesso na mesma janela, que mostra "Faz parte de" com o pai', async () => {
  window.location.hash = '#/processos/p1'
  montarVerso(processoLido(ETAPAS), 'integrante_ep', [subprocesso('p2', 'Conferir Ofício')])
  fireEvent.click((await regiao('Subprocessos (1)')).getByRole('link', { name: 'Conferir Ofício' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p2'))
  expect(await screen.findByRole('dialog', { name: 'Processo Conferir Ofício' })).toBeTruthy()
  const pai = await regiao('Faz parte de')
  expect(pai.getByRole('link', { name: 'Emitir Ofício' }).getAttribute('href')).toBe('#/processos/p1')
  expect(pai.getByText('Revisão interna')).toBeTruthy()
})

test('sem pai nem subprocessos, a Estrutura não aparece', async () => {
  montarVerso(processoLido(ETAPAS))
  const aberto = await versoAberto()
  await aberto.findByRole('region', { name: 'Sobre' })
  expect(aberto.queryByRole('region', { name: /^Subprocessos/ })).toBeNull()
  expect(aberto.queryByRole('region', { name: 'Faz parte de' })).toBeNull()
})
