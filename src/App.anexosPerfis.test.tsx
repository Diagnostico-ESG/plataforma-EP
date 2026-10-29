import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Perfil } from './acesso/tipos'
import { RECUSAS_DOS_PROCESSOS } from './processos/processosSupabase'
import { falhaDoBanco } from './processos/recusasDoBanco'
import type { ProcessoLido } from './processos/tipos'
import { umProcessoLido } from './testes/processoDaLista'
import { anexoDeTeste, secaoDeAnexos } from './testes/anexosDeTeste'
import { montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { escolherNoMenuDoProcesso } from './testes/versoDoCartao'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
  URL.createObjectURL = vi.fn(() => 'blob:arquivo')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(window, 'open').mockImplementation(() => ({ location: { href: '' }, close: vi.fn() }) as unknown as Window)
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.location.hash = ''
})

const doProcesso = (mudancas: Partial<ProcessoLido>) => (falso: { processos: ProcessoLido[] }) => {
  falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, ...mudancas } : processo))
}
const comAnexo = (falso: VersoesFalso) => { falso.anexos.anexos.p1 = [anexoDeTeste(1, 'resposta.eml')] }

test.each<Perfil>(['administrador', 'integrante_ep'])('%s vê [Enviar anexo] com o processo em andamento', async (perfil) => {
  montarNosCadastros({ perfil, ajustarVersoes: comAnexo })
  expect((await (await secaoDeAnexos()).findByRole('button', { name: 'Enviar anexo' }))).toBeTruthy()
})

test('a Consulta vê a lista e baixa, sem [Enviar anexo]', async () => {
  const { versoes } = montarNosCadastros({ perfil: 'consulta', ajustarVersoes: comAnexo })
  const secao = await secaoDeAnexos()
  fireEvent.click(await secao.findByRole('link', { name: 'Baixar resposta.eml' }))
  await waitFor(() => expect(versoes.baixados).toEqual(['an1']))
  expect(secao.queryByRole('button', { name: 'Enviar anexo' })).toBeNull()
})

test.each<[string, Partial<ProcessoLido>]>([
  ['suspenso', { situacao: 'suspenso' }],
  ['cancelado', { situacao: 'cancelado' }],
  ['concluído', { situacao: 'concluido' }],
])('processo %s: só ler e baixar, sem [Enviar anexo]', async (_nome, mudancas) => {
  montarNosCadastros({ ajustarProcessos: doProcesso(mudancas), ajustarVersoes: comAnexo })
  const secao = await secaoDeAnexos()
  expect(await secao.findByRole('link', { name: 'Baixar resposta.eml' })).toBeTruthy()
  expect(secao.queryByRole('button', { name: 'Enviar anexo' })).toBeNull()
})

test('o subprocesso tem os próprios anexos, e o pai não mostra os dos filhos', async () => {
  const filho = umProcessoLido('Filho Teste', { id: 'p5', tipo: 'subprocesso', processoPaiId: 'p1' }, 'modelagem')
  const montagem = {
    ajustarProcessos: (falso: { processos: ProcessoLido[] }) => { falso.processos = [...falso.processos, filho] },
    ajustarVersoes: (falso: VersoesFalso) => {
      falso.anexos.anexos.p1 = [anexoDeTeste(1, 'do-pai.pdf')]
      falso.anexos.anexos.p5 = [anexoDeTeste(2, 'do-filho.pdf')]
    },
  }
  montarNosCadastros(montagem)
  const doPai = await secaoDeAnexos()
  expect(await doPai.findByText('do-pai.pdf')).toBeTruthy()
  expect(doPai.queryByText('do-filho.pdf')).toBeNull()
  cleanup()
  window.location.hash = '#/processos/p5'
  montarNosCadastros(montagem)
  const doFilho = await secaoDeAnexos()
  expect(await doFilho.findByText('do-filho.pdf')).toBeTruthy()
  expect(doFilho.queryByText('do-pai.pdf')).toBeNull()
})

test('o anexo enviado aparece no histórico do processo: "Enviou o anexo \'…\' (etapa)"', async () => {
  montarNosCadastros({ ajustarProcessos: naEtapa('modelagem') })
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  const secao = await secaoDeAnexos()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar anexo' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar anexo' }))
  fireEvent.change(form.getByLabelText('Anexo'), { target: { files: [new File(['de: setor'], 'resposta.eml')] } })
  const enviar = form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
  await waitFor(() => expect(enviar.disabled).toBe(false))
  fireEvent.click(enviar)
  await secao.findByText('resposta.eml')
  await escolherNoMenuDoProcesso('Histórico')
  expect(await painel.findByText("Enviou o anexo 'resposta.eml' (Modelagem piloto)")).toBeTruthy()
})

test('processo com anexo não se exclui, e a tela diz quantos há e o caminho', async () => {
  const { processos } = montarNosCadastros()
  await screen.findByRole('dialog', { name: /^Processo( |$)/ })
  await escolherNoMenuDoProcesso('Excluir')
  processos.falhaDeGravacao = falhaDoBanco({ code: 'P0001', message: 'processo_com_anexos:2' }, RECUSAS_DOS_PROCESSOS)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  expect((await screen.findByRole('alert')).textContent)
    .toBe('Não é possível excluir: processo tem 2 anexos. Cancele o processo em vez de excluí-lo.')
  expect(processos.processos.map((processo) => processo.id)).toContain('p1')
})

test('a Consulta vê os anexos sem [Retirar]', async () => {
  montarNosCadastros({ perfil: 'consulta', ajustarVersoes: comAnexo })
  const secao = await secaoDeAnexos()
  expect(await secao.findByRole('link', { name: 'Baixar resposta.eml' })).toBeTruthy()
  expect(secao.queryByRole('button', { name: /^Retirar/ })).toBeNull()
})

test.each<[string, Partial<ProcessoLido>]>([
  ['suspenso', { situacao: 'suspenso' }],
  ['cancelado', { situacao: 'cancelado' }],
  ['concluído', { situacao: 'concluido' }],
])('processo %s: o anexo só se lê e se baixa, sem [Retirar]', async (_nome, mudancas) => {
  montarNosCadastros({ ajustarProcessos: doProcesso(mudancas), ajustarVersoes: comAnexo })
  const secao = await secaoDeAnexos()
  expect(await secao.findByRole('link', { name: 'Baixar resposta.eml' })).toBeTruthy()
  expect(secao.queryByRole('button', { name: /^Retirar/ })).toBeNull()
})
