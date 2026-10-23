import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  blocoDasAnotacoes, campoDasAnotacoes, digitarNasAnotacoes, passarAPausa, processoDasAnotacoes,
} from './testes/anotacoesNoVerso'
import { montarVerso } from './testes/processoNoVerso'
import { escolherNoMenuDoProcesso, janelasPorCima, versoAberto } from './testes/versoDoCartao'

// O relógio simulado deixa a pausa de 1 segundo ao teste; shouldAdvanceTime mantém o findBy funcionando.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const PERGUNTA = 'As anotações não foram salvas. Sair mesmo assim?'
const TEXTO_DA_FALHA = 'Não foi possível salvar. Seu texto continua aqui'
const TEXTO_DO_CONFLITO = 'Outra pessoa alterou as anotações enquanto você escrevia'
const fecharAJanela = async () => fireEvent.click((await versoAberto()).getByRole('button', { name: 'Fechar a janela' }))
const valorDoCampo = async () => ((await campoDasAnotacoes()) as HTMLTextAreaElement).value
const verso = () => screen.queryByRole('dialog', { name: /^Processo/ })

test('a falha mostra o aviso, mantém o texto e a próxima pausa tenta de novo', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 1
  await digitarNasAnotacoes('Primeiro')
  await passarAPausa()
  expect((await (await blocoDasAnotacoes()).findByRole('alert')).textContent).toBe(TEXTO_DA_FALHA)
  expect(await valorDoCampo()).toBe('Primeiro')
  expect((await blocoDasAnotacoes()).queryByText('Salvo')).toBeNull()
  await digitarNasAnotacoes('Primeiro e segundo')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText('Salvo')).toBeTruthy()
  expect(falso.anotacoes.gravacoes.map((gravacao) => gravacao.novo)).toEqual(['Primeiro', 'Primeiro e segundo'])
})

test('o conflito avisa, mantém o texto, para de gravar e "Ver o texto atual" traz o texto e o autor da outra pessoa', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Meu texto')
  falso.anotacoes.alterarComoOutraPessoa('p1', 'Do colega', 'Bia Teste')
  await passarAPausa()
  expect((await (await blocoDasAnotacoes()).findByRole('alert')).textContent).toContain(TEXTO_DO_CONFLITO)
  expect(await valorDoCampo()).toBe('Meu texto')
  expect((await blocoDasAnotacoes()).queryByText('Salvo')).toBeNull()
  await digitarNasAnotacoes('Meu texto maior')
  await passarAPausa()
  expect(falso.anotacoes.gravacoes).toHaveLength(1)
  fireEvent.click((await blocoDasAnotacoes()).getByRole('button', { name: 'Ver o texto atual' }))
  await waitFor(async () => expect(await valorDoCampo()).toBe('Do colega'))
  await waitFor(async () => expect(document.activeElement).toBe(await campoDasAnotacoes()))
  expect((await blocoDasAnotacoes()).getByText('Alterado por Bia Teste em 13/10, 15:05')).toBeTruthy()
  await digitarNasAnotacoes('Do colega e eu')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText('Salvo')).toBeTruthy()
  expect(falso.anotacoes.gravacoes.at(-1)).toEqual({ id: 'p1', esperado: 'Do colega', novo: 'Do colega e eu' })
})

test('fechar o verso com texto pendente grava na hora e fecha, sem perguntar', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Pendente')
  await fecharAJanela()
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'Pendente' }])
})

test('fechar sem texto pendente fecha na hora', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await campoDasAnotacoes()
  await fecharAJanela()
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toHaveLength(0)
})

test('Esc com texto pendente também grava e fecha', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Pendente')
  fireEvent(screen.getByRole('dialog', { name: /^Processo/ }), new Event('cancel', { cancelable: true }))
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toHaveLength(1)
})

test('fechar com a gravação falhando pergunta; [Continuar escrevendo] mantém a janela e o texto', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 1
  await digitarNasAnotacoes('Ainda não gravado')
  await fecharAJanela()
  const pergunta = within(await screen.findByRole('dialog', { name: PERGUNTA }))
  fireEvent.click(pergunta.getByRole('button', { name: 'Continuar escrevendo' }))
  await waitFor(() => expect(janelasPorCima().filter((janela) => janela.hasAttribute('open'))).toHaveLength(0))
  expect(verso()).not.toBeNull()
  expect(await valorDoCampo()).toBe('Ainda não gravado')
  await fecharAJanela()
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toHaveLength(2)
})

test('fechar com a gravação falhando e escolher [Sair sem salvar] fecha sem gravar', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 5
  await digitarNasAnotacoes('Perdido de propósito')
  await fecharAJanela()
  fireEvent.click(within(await screen.findByRole('dialog', { name: PERGUNTA })).getByRole('button', { name: 'Sair sem salvar' }))
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.porProcesso.p1).toBeUndefined()
})

test('fechar em conflito também pergunta', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Meu texto')
  falso.anotacoes.alterarComoOutraPessoa('p1', 'Do colega', 'Bia Teste')
  await fecharAJanela()
  expect(await screen.findByRole('dialog', { name: PERGUNTA })).toBeTruthy()
})

test('abrir um subprocesso com texto pendente grava antes de trocar', async () => {
  const filho = processoDasAnotacoes({ id: 'p2', nome: 'Filho Teste', tipo: 'subprocesso', processoPaiId: 'p1' })
  const falso = montarVerso(processoDasAnotacoes(), 'integrante_ep', [filho])
  await digitarNasAnotacoes('Do pai, pendente')
  fireEvent.click(await (await versoAberto()).findByRole('link', { name: 'Filho Teste' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p2'))
  expect(falso.anotacoes.porProcesso.p1?.texto).toBe('Do pai, pendente')
})

test('abrir o Histórico com a gravação falhando pergunta; [Sair sem salvar] abre o Histórico', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 5
  await digitarNasAnotacoes('Pendente')
  await escolherNoMenuDoProcesso('Histórico')
  fireEvent.click(within(await screen.findByRole('dialog', { name: PERGUNTA })).getByRole('button', { name: 'Sair sem salvar' }))
  expect(await screen.findByRole('heading', { name: 'Histórico' })).toBeTruthy()
})

test('abrir o Editar com a gravação falhando pergunta; [Continuar escrevendo] mantém o verso e o texto', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 5
  await digitarNasAnotacoes('Pendente')
  await escolherNoMenuDoProcesso('Editar')
  fireEvent.click(within(await screen.findByRole('dialog', { name: PERGUNTA })).getByRole('button', { name: 'Continuar escrevendo' }))
  await waitFor(() => expect(janelasPorCima().filter((janela) => janela.hasAttribute('open'))).toHaveLength(0))
  expect(await valorDoCampo()).toBe('Pendente')
})

test('com texto pendente o navegador pergunta ao fechar a aba; sem pendência, não', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Pendente')
  const comPendencia = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(comPendencia)
  expect(comPendencia.defaultPrevented).toBe(true)
  await passarAPausa()
  await (await blocoDasAnotacoes()).findByText('Salvo')
  const semPendencia = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(semPendencia)
  expect(semPendencia.defaultPrevented).toBe(false)
})

test('"Salvando…" fica numa região de status e a falha chega como alerta', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.segurar = true
  await digitarNasAnotacoes('A')
  await passarAPausa()
  expect((await blocoDasAnotacoes()).getByRole('status').textContent).toBe('Salvando…')
  falso.anotacoes.falhasProgramadas = 1
  await act(async () => falso.anotacoes.liberar())
  expect((await (await blocoDasAnotacoes()).findByRole('alert')).textContent).toBe(TEXTO_DA_FALHA)
})
