import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { UltimaVersao } from './processos/tipos'
import { BIA, EU, diasAtras, etapaDoProcesso, montarVerso, processoLido } from './testes/processoNoVerso'
import { agoraDoVerso, janelasPorCima } from './testes/versoDoCartao'

// O cartão "Agora" do verso (ticket 17 de processos-etapas): a etapa atual, quem cuida dela, os dias e o botão principal.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM = 'Reunião de modelagem'
const RELATORIO = 'Relatório e modelagem técnica'
const REVISAO = 'Revisão interna'
const PUBLICACAO = 'Publicação'

const CONCLUIDA = { status: 'concluida', iniciadaEm: '2026-10-01', resolvidaEm: '2026-10-02' } as const

// A modelagem em andamento há 6 dias; o relatório e a publicação (opcional) pendentes.
const caminho = (mudancas = {}) => [
  etapaDoProcesso(4, 'modelagem', MODELAGEM, { status: 'em_andamento', iniciadaEm: diasAtras(6), ...mudancas }),
  etapaDoProcesso(5, 'relatorio', RELATORIO),
  etapaDoProcesso(9, 'publicacao', PUBLICACAO, { obrigatoria: false }),
]

test('a etapa atual pendente tem [Iniciar], que grava e passa a [Concluir]', async () => {
  const falso = montarVerso(processoLido(caminho({ status: 'pendente', iniciadaEm: null })))
  const agora = await agoraDoVerso()
  expect(agora.getByText('Agora · etapa 1 de 3')).toBeTruthy()
  expect(agora.getByRole('heading', { name: MODELAGEM })).toBeTruthy()
  fireEvent.click(agora.getByRole('button', { name: `Iniciar ${MODELAGEM}` }))
  expect(await agora.findByRole('button', { name: `Concluir ${MODELAGEM}` })).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'iniciar', id: 'a4' }])
})

test('[Concluir] abre a janela de avanço com a próxima etapa', async () => {
  montarVerso(processoLido(caminho()))
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${MODELAGEM}` }))
  expect(screen.getByRole('dialog', { name: `Concluir ${MODELAGEM} e iniciar ${RELATORIO}` })).toBeTruthy()
})

test('na última etapa, [Concluir] grava direto, sem janela', async () => {
  const falso = montarVerso(processoLido([
    etapaDoProcesso(4, 'modelagem', MODELAGEM, CONCLUIDA),
    etapaDoProcesso(5, 'relatorio', RELATORIO, { status: 'em_andamento', iniciadaEm: diasAtras(2) }),
  ]))
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${RELATORIO}` }))
  expect(janelasPorCima()).toEqual([])
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'concluir', id: 'a5', usuarioId: null }]))
})

test('o "⋯" do Agora tem Realizada anteriormente e, só na etapa opcional, Dispensar', async () => {
  montarVerso(processoLido(caminho()))
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  expect(agora.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Realizada anteriormente'])
  fireEvent.click(agora.getByRole('menuitem', { name: 'Realizada anteriormente' }))
  expect(screen.getByRole('dialog', {
    name: `Registrar ${MODELAGEM} como realizada anteriormente e iniciar ${RELATORIO}` })).toBeTruthy()
})

test('na etapa opcional, o "⋯" também tem Dispensar', async () => {
  montarVerso(processoLido([
    etapaDoProcesso(4, 'modelagem', MODELAGEM, CONCLUIDA),
    etapaDoProcesso(5, 'relatorio', RELATORIO, CONCLUIDA),
    etapaDoProcesso(9, 'publicacao', PUBLICACAO, { obrigatoria: false }),
  ]))
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  expect(agora.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Dispensar', 'Realizada anteriormente'])
  fireEvent.click(agora.getByRole('menuitem', { name: 'Dispensar' }))
  expect(screen.getByRole('dialog', { name: `Dispensar a etapa ${PUBLICACAO}?` })).toBeTruthy()
})

test('sem responsável, o Agora diz isso e oferece [Assumir], que põe quem está na tela', async () => {
  const falso = montarVerso(processoLido(caminho()))
  const agora = await agoraDoVerso()
  expect(agora.getByText('Sem responsável')).toBeTruthy()
  fireEvent.click(agora.getByRole('button', { name: `Assumir ${MODELAGEM}` }))
  expect(await agora.findByText(EU.nome)).toBeTruthy()
  expect(agora.queryByRole('button', { name: `Assumir ${MODELAGEM}` })).toBeNull()
  expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a4', usuarioId: EU.id }])
})

test('na Revisão interna, o autor da versão mais recente não vê [Assumir]', async () => {
  const versao: UltimaVersao = { numero: 3, autorId: EU.id, autorNome: EU.nome }
  montarVerso(processoLido([
    etapaDoProcesso(4, 'modelagem', MODELAGEM, CONCLUIDA),
    etapaDoProcesso(6, 'revisao_interna', REVISAO, { status: 'em_andamento', iniciadaEm: diasAtras(1) }),
  ], { ultimaVersao: versao }))
  const agora = await agoraDoVerso()
  expect(agora.getByRole('heading', { name: REVISAO })).toBeTruthy()
  expect(agora.queryByRole('button', { name: `Assumir ${REVISAO}` })).toBeNull()
})

test('"Trocar" lista quem está na tela primeiro, com (você), e Ninguém por enquanto no fim; grava ao escolher', async () => {
  const falso = montarVerso(processoLido(caminho()))
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: `Trocar o responsável de ${MODELAGEM}` }))
  const lista = agora.getByRole('combobox', { name: `Responsável de ${MODELAGEM}` })
  expect(within(lista).getAllByRole('option').map((opcao) => opcao.textContent))
    .toEqual([`${EU.nome} (você)`, BIA.nome, 'Ninguém por enquanto'])
  fireEvent.change(lista, { target: { value: BIA.id } })
  expect(await agora.findByText(BIA.nome)).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a4', usuarioId: BIA.id }])
  fireEvent.click(agora.getByRole('button', { name: `Trocar o responsável de ${MODELAGEM}` }))
  fireEvent.change(agora.getByRole('combobox', { name: `Responsável de ${MODELAGEM}` }), { target: { value: '' } })
  expect(await agora.findByText('Sem responsável')).toBeTruthy()
})

test('se a gravação do "Trocar" falha, a mensagem aparece e o responsável fica como estava', async () => {
  const falso = montarVerso(processoLido(caminho({ responsavelId: BIA.id, responsavelNome: BIA.nome })))
  falso.falhaDeGravacao = 'sem conexão'
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: `Trocar o responsável de ${MODELAGEM}` }))
  fireEvent.change(agora.getByRole('combobox', { name: `Responsável de ${MODELAGEM}` }), { target: { value: EU.id } })
  expect((await screen.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(agora.getByText(BIA.nome)).toBeTruthy()
})

test('até 15 dias o Agora mostra "há n dias"; a partir de 16, a pílula "n dias nesta etapa"', async () => {
  montarVerso(processoLido(caminho({ iniciadaEm: diasAtras(15) })))
  const quinze = await agoraDoVerso()
  expect(quinze.getByText('há 15 dias')).toBeTruthy()
  expect(quinze.queryByText(/dias nesta etapa/)).toBeNull()
  cleanup()
  montarVerso(processoLido(caminho({ iniciadaEm: diasAtras(16) })))
  const dezesseis = await agoraDoVerso()
  expect(dezesseis.getByText('16 dias nesta etapa')).toBeTruthy()
  expect(dezesseis.queryByText('há 16 dias')).toBeNull()
})

test('a etapa iniciada hoje mostra "hoje"', async () => {
  montarVerso(processoLido(caminho({ iniciadaEm: diasAtras(0) })))
  expect((await agoraDoVerso()).getByText('hoje')).toBeTruthy()
})

test('a Consulta vê o Agora sem botões nem "Trocar", com a borda cinza e "Com {nome} há {n} dias"', async () => {
  montarVerso(processoLido(caminho({ responsavelId: BIA.id, responsavelNome: BIA.nome })), 'consulta')
  const agora = await agoraDoVerso()
  expect(agora.queryAllByRole('button')).toEqual([])
  expect(agora.getByText(`Com ${BIA.nome} há 6 dias`)).toBeTruthy()
  expect(agora.getByRole('heading', { name: MODELAGEM }).closest('section')?.classList.contains('agora-leitura')).toBe(true)
})

test('a Consulta vê "Sem responsável" quando a etapa não tem ninguém', async () => {
  montarVerso(processoLido(caminho()), 'consulta')
  expect((await agoraDoVerso()).getByText('Sem responsável')).toBeTruthy()
})
