import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { montarNosCadastros } from './testes/processosNosCadastros'
import { versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

// A miniatura do fluxograma no verso enxuto (ticket 05 de redesenho-do-quadro): a imagem da versão mais recente nos cinco estados
// (sem versão, carregando, sem .png, erro e imagem) e o clique que abre o .png inteiro.

type Aba = { location: { href: string }; close: ReturnType<typeof vi.fn> }
let abas: Aba[]

beforeEach(() => {
  window.location.hash = '#/processos/p1'
  abas = []
  URL.createObjectURL = vi.fn(() => 'blob:miniatura')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(window, 'open').mockImplementation(() => {
    const aba: Aba = { location: { href: '' }, close: vi.fn() }
    abas.push(aba)
    return aba as unknown as Window
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.location.hash = ''
})

const doVerso = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
const destaque = async () => within(await (await doVerso()).findByRole('article', { name: 'V1' }))
const comUmaVersao = { ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = [versaoDeTeste(1)] } }
const semPng = { ajustarVersoes: (falso: VersoesFalso) => {
  const versao = versaoDeTeste(1)
  falso.versoes.p1 = [{ ...versao, arquivos: versao.arquivos.filter(({ papel }) => papel !== 'png') }]
} }

test('com o .png, a imagem aparece com o texto alternativo "Fluxograma V1 de Emitir Ofício" e vem do módulo de versões', async () => {
  const { versoes } = montarNosCadastros(comUmaVersao)
  const imagem = await (await destaque()).findByRole('img', { name: 'Fluxograma V1 de Emitir Ofício' })
  expect(imagem.getAttribute('src')).toBe('blob:miniatura')
  expect(versoes.baixados).toEqual(['a1-png'])
})

test('enquanto a imagem carrega, há um quadro cinza do mesmo tamanho, sem imagem', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => {
    falso.versoes.p1 = [versaoDeTeste(1)]
    falso.baixarArquivo = () => new Promise(() => {})
  } })
  const v1 = await destaque()
  await waitFor(() => expect(v1.getByRole('status', { name: 'Carregando a imagem' })).toBeTruthy())
  expect(v1.queryByRole('img')).toBeNull()
})

test('versão sem .png mostra o ícone do fluxograma e "Sem imagem (.png) nesta versão", sem pedir arquivo', async () => {
  const { versoes } = montarNosCadastros(semPng)
  expect(await (await destaque()).findByText('Sem imagem (.png) nesta versão')).toBeTruthy()
  expect(versoes.baixados).toEqual([])
})

test('se a imagem não carrega, o quadro avisa e o resto do verso continua', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => {
    falso.versoes.p1 = [versaoDeTeste(1)]
    falso.falharNoDownload = true
  } })
  const v1 = await destaque()
  expect(await v1.findByText('Não foi possível carregar a imagem.')).toBeTruthy()
  expect(v1.getByRole('link', { name: /Fluxograma \.bpm/ })).toBeTruthy()
})

test('sem versão, não há miniatura: fica o aviso de que nenhuma foi enviada', async () => {
  const { versoes } = montarNosCadastros({ ajustarVersoes: (falso) => { falso.versoes.p1 = [] } })
  expect(await (await doVerso()).findByText('Nenhuma versão enviada ainda')).toBeTruthy()
  expect(versoes.baixados).toEqual([])
})

test('clicar na imagem abre o .png inteiro numa aba nova, com o que já foi baixado', async () => {
  const { versoes } = montarNosCadastros(comUmaVersao)
  const imagem = await (await destaque()).findByRole('img', { name: 'Fluxograma V1 de Emitir Ofício' })
  fireEvent.click(imagem)
  await waitFor(() => expect(abas[0]?.location.href).toBe('blob:miniatura'))
  expect(versoes.baixados).toEqual(['a1-png'])
})

test('ao fechar o verso, o endereço temporário da imagem é liberado', async () => {
  montarNosCadastros(comUmaVersao)
  await (await destaque()).findByRole('img', { name: 'Fluxograma V1 de Emitir Ofício' })
  window.location.hash = ''
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:miniatura'))
})

// Regressão da revisão do /ship (2026-11-02): o .png baixa mas o navegador não consegue desenhá-lo.
test('se o navegador não consegue desenhar a imagem baixada, o quadro mostra o aviso de erro', async () => {
  montarNosCadastros(comUmaVersao)
  const v1 = await destaque()
  fireEvent.error(await v1.findByRole('img', { name: 'Fluxograma V1 de Emitir Ofício' }))
  expect(await v1.findByText('Não foi possível carregar a imagem.')).toBeTruthy()
  expect(v1.queryByRole('img')).toBeNull()
})
