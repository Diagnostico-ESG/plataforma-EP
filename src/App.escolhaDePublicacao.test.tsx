import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { EtapaDoProcesso, ProcessoLido } from './processos/tipos'
import {
  APROVACAO, BIA, PUBLICACAO, TITULO_DA_JANELA, abrirAJanela, botao, caminho, montar, responder, versao,
} from './testes/aprovacaoNoVerso'
import { agoraDoVerso, etapasDoVerso } from './testes/versoDoCartao'

// "Vai para publicação?" na janela que resolve a Aprovação pelo setor (publicacao-e-arquivamento, ticket 01, histórias 3
// a 9, 41 e 43): obrigatória, "Sim" com o responsável da Publicação, "Não" levando o processo a Concluídos, pela janela de
// concluir, pela "realizada anteriormente" e pelo arrastar; sem a Publicação, sem pergunta.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const PERGUNTA_DO_RESPONSAVEL = 'Quem fica com a próxima etapa?'
const pergunta = (janela: ReturnType<typeof within>) => janela.queryByRole('radiogroup', { name: 'Vai para publicação?' })
const processoNoFalso = (falso: { processos: ProcessoLido[] }) => falso.processos[0]

test('sem resposta a janela não conclui; "Sim" pede o responsável e deixa a Publicação em andamento com ele', async () => {
  const { falso, revisoes } = montar(versao())
  const janela = await abrirAJanela()
  expect(pergunta(janela)).toBeTruthy()
  expect(janela.queryByText(PERGUNTA_DO_RESPONSAVEL)).toBeNull()
  expect(botao(janela).disabled).toBe(true)
  responder(janela, 'Sim')
  expect(janela.getByText(PERGUNTA_DO_RESPONSAVEL)).toBeTruthy()
  fireEvent.click(janela.getByRole('radio', { name: BIA.nome }))
  fireEvent.click(botao(janela))
  expect(await (await etapasDoVerso()).findByRole('button', { name: `${PUBLICACAO}: atual` })).toBeTruthy()
  expect(revisoes.aprovacoesConcluidas).toMatchObject([{ andamentoId: 'a5', responsavelId: BIA.id }])
  expect(processoNoFalso(falso)).toMatchObject({ situacao: 'em_andamento', vaiParaPublicacao: true })
  expect(processoNoFalso(falso).etapasDoProcesso[3]).toMatchObject({ status: 'em_andamento', responsavelId: BIA.id })
})

test('"Não" esconde o responsável e leva o processo a Concluídos, com a Publicação pendente', async () => {
  const { falso } = montar(versao())
  const janela = await abrirAJanela()
  responder(janela, 'Sim')
  responder(janela, 'Não')
  expect(janela.queryByText(PERGUNTA_DO_RESPONSAVEL)).toBeNull()
  fireEvent.click(botao(janela))
  await waitFor(() => expect(processoNoFalso(falso)).toMatchObject({ situacao: 'concluido', vaiParaPublicacao: false, etapaAtual: null }))
  expect(processoNoFalso(falso).etapasDoProcesso[3].status).toBe('pendente')
  expect(within(await screen.findByRole('region', { name: 'Concluídos' })).getByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})

test('"realizada anteriormente" na Aprovação também pergunta e só registra com a resposta', async () => {
  const { falso } = montar(versao())
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(agora.getByRole('menuitem', { name: 'Realizada anteriormente' }))
  const janela = within(await screen.findByRole('dialog', { name: `Registrar ${APROVACAO} como realizada anteriormente` }))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Aprovada antes da plataforma' } })
  expect(botao(janela, 'Registrar').disabled).toBe(true)
  responder(janela, 'Não')
  fireEvent.click(botao(janela, 'Registrar'))
  await waitFor(() => expect(falso.chamadas).toMatchObject([{ acao: 'realizada', id: 'a5', usuarioId: null, vai: false }]))
  expect(processoNoFalso(falso).situacao).toBe('concluido')
})

test('sem a Publicação no processo (desativada), a janela não pergunta e o processo conclui', async () => {
  const { falso } = montar(versao(), { etapas: caminho().slice(0, 3) })
  const janela = await abrirAJanela(TITULO_DA_JANELA)
  expect(pergunta(janela)).toBeNull()
  fireEvent.click(botao(janela))
  await waitFor(() => expect(processoNoFalso(falso).situacao).toBe('concluido'))
})

test('a recusa do banco aparece em vermelho na janela, que fica aberta com a resposta e o preenchido', async () => {
  const { revisoes } = montar(versao())
  revisoes.falhaNaGravacao = new TravaDoBanco('Responda se o processo vai para publicação.')
  const janela = await abrirAJanela()
  fireEvent.change(janela.getByLabelText(/Número do E-protocolo/), { target: { value: 'PROT-7' } })
  responder(janela, 'Não')
  fireEvent.click(botao(janela))
  expect((await janela.findByRole('alert')).textContent).toBe('Responda se o processo vai para publicação.')
  expect((janela.getByRole('radio', { name: 'Não' }) as HTMLInputElement).checked).toBe(true)
  expect((janela.getByLabelText(/Número do E-protocolo/) as HTMLInputElement).value).toBe('PROT-7')
})

// ---- Pelo arrastar no Quadro: o cartão da Aprovação vai à coluna Publicação, e a mesma janela pergunta.

const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

function comCartao(etapas: EtapaDoProcesso[]): Partial<ProcessoLido> {
  return {
    cartao: {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: '2026-10-12', responsavelAtivo: true, ultimaVersao: null, subprocessos: 0,
      caminho: etapas.map((etapa) => ({ codigo: etapa.codigo, status: etapa.status })),
    },
  }
}

async function arrastarPara(coluna: string) {
  window.location.hash = '#/processos'
  const cartao = (await screen.findByText('Emitir Ofício', { selector: '.cartao-nome' })).closest('a') as HTMLElement
  fireEvent.dragStart(cartao, { dataTransfer })
  fireEvent.dragOver(screen.getByRole('region', { name: coluna }), { dataTransfer })
  fireEvent.drop(screen.getByRole('region', { name: coluna }), { dataTransfer })
}

test('arrastar o cartão da Aprovação para a Publicação abre a janela com a pergunta; "Não" o leva a Concluídos', async () => {
  const { falso } = montar(versao(), { mudancas: comCartao(caminho()) })
  await arrastarPara(PUBLICACAO)
  const janela = within(await screen.findByRole('dialog', { name: TITULO_DA_JANELA }))
  expect(pergunta(janela)).toBeTruthy()
  responder(janela, 'Não')
  fireEvent.click(botao(janela))
  await waitFor(() => expect(processoNoFalso(falso).situacao).toBe('concluido'))
})

test('a Consulta não tem [Concluir] nem arrasta o cartão', async () => {
  montar(versao(), { perfil: 'consulta', mudancas: comCartao(caminho()) })
  expect((await agoraDoVerso()).queryByRole('button', { name: `Concluir ${APROVACAO}` })).toBeNull()
  window.location.hash = '#/processos'
  const cartao = (await screen.findByText('Emitir Ofício', { selector: '.cartao-nome' })).closest('a') as HTMLElement
  expect(cartao.getAttribute('draggable')).toBe('false')
})
