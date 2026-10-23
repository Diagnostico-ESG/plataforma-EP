import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { AnotacoesLidas, SituacaoDoProcesso } from './processos/tipos'
import {
  blocoDasAnotacoes, campoDasAnotacoes, digitarNasAnotacoes, passarAPausa, processoDasAnotacoes,
} from './testes/anotacoesNoVerso'
import { montarVerso } from './testes/processoNoVerso'
import { escolherNoMenuDoProcesso, versoAberto } from './testes/versoDoCartao'

// O relógio simulado deixa a pausa de 1 segundo ao teste; shouldAdvanceTime mantém o findBy funcionando.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const DA_BIA: AnotacoesLidas = { texto: 'Linha 1\nLinha 2', alteradoPor: 'Bia Teste', alteradoEm: '2026-10-12T15:05:00Z' }

test('o bloco é o primeiro da coluna direita, acima da Reunião, com o campo "Anotações" e a dica no vazio', async () => {
  montarVerso(processoDasAnotacoes())
  const campo = await campoDasAnotacoes()
  const coluna = campo.closest('.verso-contexto') as HTMLElement
  expect(coluna.firstElementChild?.querySelector('h3')?.textContent).toBe('Anotações')
  expect(campo.getAttribute('placeholder')).toBe('Escreva aqui as anotações do processo')
  const titulos = (await (await versoAberto()).findAllByRole('heading', { level: 3 })).map((titulo) => titulo.textContent)
  expect(titulos.indexOf('Anotações')).toBeLessThan(titulos.indexOf('Reunião'))
})

test('sem anotação gravada, a linha "Alterado por" não aparece; o estado fica vazio mas existe para o leitor de tela', async () => {
  montarVerso(processoDasAnotacoes())
  await campoDasAnotacoes()
  const bloco = await blocoDasAnotacoes()
  expect(bloco.queryByText(/^Alterado/)).toBeNull()
  expect(bloco.getByRole('status').textContent).toBe('')
})

test('digitar e parar grava uma vez, com "Salvando…" e depois "Salvo"', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.segurar = true
  await digitarNasAnotacoes('Combinado com o setor')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText('Salvando…')).toBeTruthy()
  await act(async () => falso.anotacoes.liberar())
  expect(await (await blocoDasAnotacoes()).findByText('Salvo')).toBeTruthy()
  expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'Combinado com o setor' }])
})

test('digitar sem parar não grava a cada tecla', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('A')
  await act(() => vi.advanceTimersByTimeAsync(600))
  await digitarNasAnotacoes('AB')
  await act(() => vi.advanceTimersByTimeAsync(600))
  await digitarNasAnotacoes('ABC')
  expect(falso.anotacoes.gravacoes).toHaveLength(0)
  await passarAPausa()
  await waitFor(() => expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'ABC' }]))
})

test('sair do campo grava sem esperar a pausa', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Ao sair')
  fireEvent.blur(await campoDasAnotacoes())
  await waitFor(() => expect(falso.anotacoes.gravacoes).toHaveLength(1))
})

test('depois de gravar aparece "Alterado por {nome} em {dd/mm}, {hh:mm}"', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Texto')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText(`Alterado por ${USUARIO_DE_TESTE.nome} em 13/10, 14:30`)).toBeTruthy()
})

test('o texto gravado aparece ao abrir, com quem alterou', async () => {
  montarVerso(processoDasAnotacoes(), 'integrante_ep', [], (falso) => { falso.anotacoes.porProcesso.p1 = DA_BIA })
  expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Linha 1\nLinha 2')
  expect(await (await blocoDasAnotacoes()).findByText('Alterado por Bia Teste em 12/10, 12:05')).toBeTruthy()
})

test('a contagem some com 1.799 caracteres, aparece com 1.800, e o campo não passa de 2.000', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('a'.repeat(1799))
  expect((await blocoDasAnotacoes()).queryByText(/ de 2\.000$/)).toBeNull()
  await digitarNasAnotacoes('a'.repeat(1800))
  expect(await (await blocoDasAnotacoes()).findByText('1.800 de 2.000')).toBeTruthy()
  expect((await campoDasAnotacoes()).getAttribute('maxlength')).toBe('2000')
})

test('a Consulta lê o texto, com quebras de linha e "Alterado por", sem campo editável', async () => {
  montarVerso(processoDasAnotacoes(), 'consulta', [], (falso) => { falso.anotacoes.porProcesso.p1 = DA_BIA })
  const bloco = await blocoDasAnotacoes()
  expect((await bloco.findByText(/Linha 1/)).textContent).toBe('Linha 1\nLinha 2')
  expect(bloco.queryByRole('textbox')).toBeNull()
  expect(bloco.getByText('Alterado por Bia Teste em 12/10, 12:05')).toBeTruthy()
})

test('a Consulta vê "Sem anotações." quando está vazio, sem a linha "Alterado por"', async () => {
  montarVerso(processoDasAnotacoes(), 'consulta')
  const bloco = await blocoDasAnotacoes()
  expect(await bloco.findByText('Sem anotações.')).toBeTruthy()
  expect(bloco.queryByRole('textbox')).toBeNull()
  expect(bloco.queryByText(/^Alterado/)).toBeNull()
})

test('o arquivado só se lê, com a linha "Alterado por"', async () => {
  montarVerso(processoDasAnotacoes({ situacao: 'concluido', arquivadoEm: '2026-10-12T12:00:00Z' }), 'integrante_ep', [],
    (falso) => { falso.anotacoes.porProcesso.p1 = DA_BIA })
  const bloco = await blocoDasAnotacoes()
  expect((await bloco.findByText(/Linha 1/)).textContent).toBe('Linha 1\nLinha 2')
  expect(bloco.queryByRole('textbox')).toBeNull()
  expect(bloco.getByText('Alterado por Bia Teste em 12/10, 12:05')).toBeTruthy()
})

test.each<SituacaoDoProcesso>(['suspenso', 'cancelado', 'concluido'])('no processo %s ainda se escreve e grava', async (situacao) => {
  const falso = montarVerso(processoDasAnotacoes({ situacao }))
  await digitarNasAnotacoes('Por que parou')
  await passarAPausa()
  await waitFor(() => expect(falso.anotacoes.gravacoes).toHaveLength(1))
})

test('o subprocesso tem as suas Anotações, diferentes das do pai', async () => {
  const filho = processoDasAnotacoes({ id: 'p2', nome: 'Filho Teste', tipo: 'subprocesso', processoPaiId: 'p1' })
  montarVerso(processoDasAnotacoes(), 'integrante_ep', [filho], (falso) => {
    falso.anotacoes.porProcesso.p1 = { texto: 'Do pai', alteradoPor: null, alteradoEm: null }
    falso.anotacoes.porProcesso.p2 = { texto: 'Do filho', alteradoPor: null, alteradoEm: null }
  })
  expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Do pai')
  fireEvent.click(await (await versoAberto()).findByRole('link', { name: 'Filho Teste' }))
  await waitFor(async () => expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Do filho'))
})

test('o texto não vai ao Quadro nem à busca da Lista', async () => {
  montarVerso(processoDasAnotacoes(), 'integrante_ep', [], (falso) => {
    falso.anotacoes.porProcesso.p1 = { texto: 'Segredo do setor', alteradoPor: null, alteradoEm: null }
  })
  await campoDasAnotacoes()
  expect(screen.queryAllByText(/Segredo do setor/).filter((no) => no.tagName !== 'TEXTAREA' && no.closest('dialog') === null)).toHaveLength(0)
  window.location.hash = '#/processos/lista?busca=Segredo'
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
})

test('gravar as Anotações não põe nada no Histórico do processo', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Texto')
  await passarAPausa()
  await (await blocoDasAnotacoes()).findByText('Salvo')
  await escolherNoMenuDoProcesso('Histórico')
  const pagina = (await screen.findByRole('heading', { name: 'Histórico' })).closest('.verso-pagina') as HTMLElement
  expect(within(pagina).queryByText(/anota/i)).toBeNull()
})
