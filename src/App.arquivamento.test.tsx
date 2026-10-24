import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { ProcessoLido } from './processos/tipos'
import { montar } from './testes/aprovacaoNoVerso'
import { agoraDoVerso, escolherNoMenuDoProcesso, itensDoMenu, versoAberto } from './testes/versoDoCartao'

// Arquivar e desarquivar o processo concluído, o verso do arquivado sem alterações e os eventos no histórico
// (publicacao-e-arquivamento, ticket 02, histórias 23 a 28, 41 e 43). O arquivamento do suspenso e do cancelado é do
// ticket 04 de publicacao-e-arquivamento.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const CONCLUIDO: Partial<ProcessoLido> = { situacao: 'concluido', etiqueta: 'concluido', publicadoEm: null }
const ARQUIVADO: Partial<ProcessoLido> = { ...CONCLUIDO, arquivadoEm: '2026-10-12T12:00:00Z' }
const concluidos = async () => within(await screen.findByRole('region', { name: 'Concluídos' }))
const botoesDoAgora = async () => (await agoraDoVerso()).getAllByRole('button').map((botao) => botao.textContent)
const MONTAGEM = { etapa: 'concluidos' }

test('o concluído tem [Arquivar] no Agora; arquivar tira o processo de Concluídos e o Agora passa a "Arquivado" com [Desarquivar]', async () => {
  const { falso } = montar(null, { ...MONTAGEM, mudancas: CONCLUIDO })
  expect(await (await concluidos()).findByText('Emitir Ofício')).toBeTruthy()
  expect(await botoesDoAgora()).toContain('Arquivar')
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Arquivar' }))
  expect(await (await agoraDoVerso()).findByText('Arquivado')).toBeTruthy()
  expect(await botoesDoAgora()).toEqual(['Desarquivar'])
  expect(falso.processos[0].arquivadoEm).toBeTruthy()
  expect((await concluidos()).queryByText('Emitir Ofício')).toBeNull()
})

test('[Desarquivar] devolve o processo a Concluídos', async () => {
  const { falso } = montar(null, { ...MONTAGEM, mudancas: ARQUIVADO })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Desarquivar' }))
  expect(await (await concluidos()).findByText('Emitir Ofício')).toBeTruthy()
  expect(await (await agoraDoVerso()).findByRole('button', { name: 'Arquivar' })).toBeTruthy()
  expect(falso.processos[0].arquivadoEm).toBeNull()
})

test('o verso do arquivado não oferece outra alteração: sem listas, o "⋯" só tem Histórico, e as seções só leem', async () => {
  montar(null, { ...MONTAGEM, mudancas: { ...ARQUIVADO, publicadoEm: '2026-10-11' } })
  expect(await botoesDoAgora()).toEqual(['Desarquivar'])
  expect((await agoraDoVerso()).queryByRole('combobox')).toBeNull()
  expect(await itensDoMenu('Ações do processo')).toEqual(['Histórico'])
  const verso = await versoAberto()
  expect(verso.queryAllByRole('button', { name: /^(Voltar|Enviar|Marcar|Mudar|Editar|Assumir|Trocar)/ })).toEqual([])
  expect(verso.queryByRole('button', { name: 'Mais ações dos arquivos' })).toBeNull()
  expect(verso.getByText('Publicado em 11/10/2026')).toBeTruthy()
})

test('arquivar e desarquivar aparecem no histórico do processo', async () => {
  montar(null, { ...MONTAGEM, mudancas: CONCLUIDO, ajustar: ({ falso }) => {
    falso.historicoDosProcessos.p1 = [
      { id: 2, ocorridoEm: '2026-10-13T16:00:00Z', autor: 'Bia Teste', acao: 'desarquivar', entidade: 'processo',
        entidadeRef: 'p1', antes: { nome: 'Emitir Ofício' }, depois: { nome: 'Emitir Ofício' } },
      { id: 1, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Bia Teste', acao: 'arquivar', entidade: 'processo',
        entidadeRef: 'p1', antes: { nome: 'Emitir Ofício' }, depois: { nome: 'Emitir Ofício' } },
    ]
  } })
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Arquivou o processo')).toBeTruthy()
  expect(verso.getByText('Desarquivou o processo')).toBeTruthy()
})

test('a falha ao arquivar aparece em vermelho no verso e o processo fica em Concluídos', async () => {
  const { falso } = montar(null, { ...MONTAGEM, mudancas: CONCLUIDO, ajustar: ({ falso: f }) => {
    f.falhaDeGravacao = 'sem conexão'
  } })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Arquivar' }))
  expect((await (await versoAberto()).findByRole('alert')).textContent).toMatch(/sem conexão/)
  expect(falso.processos[0].arquivadoEm ?? null).toBeNull()
})

test('a Consulta vê "Arquivado" e a linha da publicação, sem botões', async () => {
  montar(null, { perfil: 'consulta', ...MONTAGEM, mudancas: { ...ARQUIVADO, publicadoEm: '2026-10-11' } })
  const agora = await agoraDoVerso()
  expect(agora.getByText('Arquivado')).toBeTruthy()
  expect(agora.getByText('Publicado em 11/10/2026')).toBeTruthy()
  expect(agora.queryAllByRole('button')).toEqual([])
})
