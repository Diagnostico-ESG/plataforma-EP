import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { SituacaoDoProcesso } from './processos/tipos'
import { PROCESSOS_DOS_CADASTROS, montarNosCadastros } from './testes/processosNosCadastros'
import { arquivoDeTeste, comNome, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

type Aba = { location: { href: string }; close: ReturnType<typeof vi.fn> }
let abas: Aba[]
let baixados: { href: string; download: string }[]
let bloquearAbas: boolean

beforeEach(() => {
  window.location.hash = '#/processos/p1'
  abas = []
  baixados = []
  bloquearAbas = false
  URL.createObjectURL = vi.fn(() => 'blob:arquivo')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(window, 'open').mockImplementation(() => {
    if (bloquearAbas) return null
    const aba: Aba = { location: { href: '' }, close: vi.fn() }
    abas.push(aba)
    return aba as unknown as Window
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    if (this.download) baixados.push({ href: this.href, download: this.download })
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.location.hash = ''
})

const versaoComRelatorio = () => versaoDeTeste(1, {
  arquivos: [arquivoDeTeste(1, 'bpm', 'bpm'), arquivoDeTeste(1, 'png', 'png'), arquivoDeTeste(1, 'relatorio', 'pdf'), arquivoDeTeste(1, 'bpmn', 'bpmn')],
})
const comUmaVersao = { ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = [versaoComRelatorio()] } }

const secao = async () => {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

test.each(['administrador', 'integrante_ep', 'consulta'] as const)('o perfil %s vê cada arquivo como link, com o nome no title', async (perfil) => {
  montarNosCadastros({ perfil, ...comUmaVersao })
  const links = await (await secao()).findAllByRole('link')
  expect(links.map((link) => link.textContent)).toEqual(['Imagem .png', 'Fluxograma .bpm', 'Relatório .pdf', 'BPMN .bpmn'])
  expect(links.map((link) => link.getAttribute('title'))).toEqual([
    'TSA_V1_Emitir Ofício.png', 'TSA_V1_Emitir Ofício.bpm', 'TSA_V1_Emitir Ofício_Relatório.pdf', 'TSA_V1_Emitir Ofício.bpmn',
  ])
})

test('clicar num .png abre uma aba nova e a leva ao arquivo, sem baixar', async () => {
  const { versoes } = montarNosCadastros({ perfil: 'consulta', ...comUmaVersao })
  fireEvent.click(await (await secao()).findByRole('link', { name: comNome('TSA_V1_Emitir Ofício.png') }))
  await waitFor(() => expect(abas[0]?.location.href).toBe('blob:arquivo'))
  expect(versoes.baixados).toEqual(['a1-png'])
  expect(baixados).toEqual([])
})

test('clicar num .pdf também abre a aba', async () => {
  montarNosCadastros({ ...comUmaVersao })
  fireEvent.click(await (await secao()).findByRole('link', { name: comNome('TSA_V1_Emitir Ofício_Relatório.pdf') }))
  await waitFor(() => expect(abas[0]?.location.href).toBe('blob:arquivo'))
})

test('clicar num .bpmn não abre aba: baixa com o nome padrão', async () => {
  montarNosCadastros({ ...comUmaVersao })
  fireEvent.click(await (await secao()).findByRole('link', { name: comNome('TSA_V1_Emitir Ofício.bpmn') }))
  await waitFor(() => expect(baixados).toEqual([{ href: 'blob:arquivo', download: 'TSA_V1_Emitir Ofício.bpmn' }]))
  expect(abas).toEqual([])
})

test('se o navegador bloqueia a aba, o .png é baixado com o nome padrão', async () => {
  bloquearAbas = true
  montarNosCadastros({ ...comUmaVersao })
  fireEvent.click(await (await secao()).findByRole('link', { name: comNome('TSA_V1_Emitir Ofício.png') }))
  await waitFor(() => expect(baixados).toEqual([{ href: 'blob:arquivo', download: 'TSA_V1_Emitir Ofício.png' }]))
})

test('falha no download fecha a aba aberta e mostra a mensagem em vermelho', async () => {
  const { versoes } = montarNosCadastros({ ...comUmaVersao })
  versoes.falharNoDownload = new TravaDoBanco('O arquivo não foi encontrado no Drive. Avise o administrador.')
  const tela = await secao()
  fireEvent.click(await tela.findByRole('link', { name: comNome('TSA_V1_Emitir Ofício.png') }))
  expect((await tela.findByRole('alert')).textContent).toBe('O arquivo não foi encontrado no Drive. Avise o administrador.')
  expect(abas[0].close).toHaveBeenCalledOnce()
  expect(baixados).toEqual([])
})

test('falha de conexão cita o arquivo e o motivo, e um novo clique limpa o aviso', async () => {
  const { versoes } = montarNosCadastros({ ...comUmaVersao })
  versoes.falharNoDownload = true
  const tela = await secao()
  fireEvent.click(await tela.findByRole('link', { name: comNome('TSA_V1_Emitir Ofício.bpmn') }))
  expect((await tela.findByRole('alert')).textContent)
    .toBe('Não foi possível baixar TSA_V1_Emitir Ofício.bpmn: falha de conexão simulada.')
  versoes.falharNoDownload = false
  fireEvent.click(tela.getByRole('link', { name: comNome('TSA_V1_Emitir Ofício.bpmn') }))
  await waitFor(() => expect(tela.queryByRole('alert')).toBeNull())
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s continua com os links de download', async (situacao: SituacaoDoProcesso) => {
  montarNosCadastros({
    ajustarProcessos: (falso: { processos: typeof PROCESSOS_DOS_CADASTROS }) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
    ...comUmaVersao,
  })
  expect((await (await secao()).findAllByRole('link')).length).toBe(4)
})
