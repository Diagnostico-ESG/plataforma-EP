import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { EtapaDoProcesso, ProcessoLido } from './processos/tipos'
import { APROVACAO, CONCLUIDA, caminho, montar } from './testes/aprovacaoNoVerso'
import { agoraDoVerso, escolherNoMenuDoProcesso, itensDoMenu, versoAberto } from './testes/versoDoCartao'

// Arquivar e desarquivar o processo concluído, o verso do arquivado sem alterações e os eventos no histórico
// (publicacao-e-arquivamento, ticket 02, histórias 23 a 28, 41 e 43).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// A Aprovação concluída e a Publicação pendente: concluído com a escolha "não".
function concluidoNaoPublicado(): EtapaDoProcesso[] {
  return caminho().map((etapa) => (etapa.codigo === 'aprovacao_setor' ? { ...etapa, ...CONCLUIDA } : etapa))
}

const CONCLUIDO: Partial<ProcessoLido> = { situacao: 'concluido', etapaAtual: null, vaiParaPublicacao: false }
const ARQUIVADO: Partial<ProcessoLido> = { ...CONCLUIDO, arquivadoEm: '2026-10-12T12:00:00Z' }
const concluidos = async () => within(await screen.findByRole('region', { name: 'Concluídos' }))
const botoesDoAgora = async () => (await agoraDoVerso()).getAllByRole('button').map((botao) => botao.textContent)

test('[Arquivar] tira o processo de Concluídos, e o Agora passa a "Arquivado" com [Desarquivar]', async () => {
  const { falso } = montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO })
  expect(await (await concluidos()).findByText('Emitir Ofício')).toBeTruthy()
  expect(await botoesDoAgora()).toEqual(['Arquivar', 'Registrar publicação'])
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Arquivar' }))
  expect(await (await agoraDoVerso()).findByText('Arquivado')).toBeTruthy()
  expect(await botoesDoAgora()).toEqual(['Desarquivar', 'Registrar publicação'])
  expect(falso.processos[0].arquivadoEm).toBeTruthy()
  expect((await concluidos()).queryByText('Emitir Ofício')).toBeNull()
})

test('[Desarquivar] devolve o processo a Concluídos', async () => {
  const { falso } = montar(null, { etapas: concluidoNaoPublicado(), mudancas: ARQUIVADO })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Desarquivar' }))
  expect(await (await concluidos()).findByText('Emitir Ofício')).toBeTruthy()
  expect(await (await agoraDoVerso()).findByRole('button', { name: 'Arquivar' })).toBeTruthy()
  expect(falso.processos[0].arquivadoEm).toBeNull()
})

test('o verso do arquivado não oferece outra alteração: o "⋯" só tem Histórico, e etapas, versões e reunião só leem', async () => {
  montar(null, { etapas: concluidoNaoPublicado(), mudancas: { ...ARQUIVADO, vaiParaPublicacao: true, publicadoEm: '2026-10-11' } })
  expect(await botoesDoAgora()).toEqual(['Desarquivar'])
  expect(await itensDoMenu('Ações do processo')).toEqual(['Histórico'])
  const verso = await versoAberto()
  expect(verso.queryAllByRole('button', { name: /^(Voltar|Enviar|Marcar|Mudar|Editar|Assumir)/ })).toEqual([])
  expect(verso.queryByRole('button', { name: 'Mais ações dos arquivos' })).toBeNull()
  expect(verso.getByText(`${APROVACAO}`)).toBeTruthy()
})

test('arquivar e desarquivar aparecem no histórico do processo', async () => {
  montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO, ajustar: ({ falso }) => {
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
  const { falso } = montar(null, { etapas: concluidoNaoPublicado(), mudancas: CONCLUIDO, ajustar: ({ falso: f }) => {
    f.falhaDeGravacao = 'sem conexão'
  } })
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: 'Arquivar' }))
  expect((await (await versoAberto()).findByRole('alert')).textContent).toMatch(/sem conexão/)
  expect(falso.processos[0].arquivadoEm ?? null).toBeNull()
})

test('a Consulta vê "Arquivado" e a linha da publicação, sem botões', async () => {
  montar(null, { perfil: 'consulta', etapas: concluidoNaoPublicado(), mudancas: ARQUIVADO })
  const agora = await agoraDoVerso()
  expect(agora.getByText('Arquivado')).toBeTruthy()
  expect(agora.getByText('Não publicado')).toBeTruthy()
  expect(agora.queryAllByRole('button')).toEqual([])
})
