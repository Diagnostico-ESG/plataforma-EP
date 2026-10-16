import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { montarNosCadastros } from './testes/reunioesNosCadastros'
import { arquivoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const AVISO = 'Não foi possível conferir os arquivos no Drive.'
const ALTERADO = 'Alterado fora da plataforma'
const NAO_ENCONTRADO = 'Não encontrado no Drive'
const PNG_V4 = 'TSA_V4_Emitir Ofício.png'
const BPMN_V4 = 'TSA_V4_Emitir Ofício.bpmn'
const RELATORIO_V3 = 'TSA_V3_Emitir Ofício_Relatório.pdf'

/** V3 com relatório e V4 só com o par. */
function comVersoes(programar: (falso: VersoesFalso) => void = () => {}) {
  return {
    ajustarVersoes: (falso: VersoesFalso) => {
      const v3 = versaoDeTeste(3, {
        arquivos: [arquivoDeTeste(3, 'bpmn', 'bpmn'), arquivoDeTeste(3, 'png', 'png'), arquivoDeTeste(3, 'relatorio', 'pdf')],
      })
      falso.versoes.p1 = [v3, versaoDeTeste(4)]
      programar(falso)
    },
  }
}

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  return within(await painel.findByRole('region', { name: 'Versões do processo' }))
}

async function itemDoArquivo(secao: Awaited<ReturnType<typeof secaoDeVersoes>>, nome: string) {
  const item = (await secao.findByRole('link', { name: nome })).closest('li')
  if (!item) throw new Error(`esperado: item de lista com o arquivo ${nome}`)
  return within(item)
}

test('marca o arquivo alterado e o não encontrado, cada um no seu item, e deixa o intacto sem marca', async () => {
  montarNosCadastros(comVersoes((falso) => {
    falso.conferencia['a4-png'] = 'alterado'
    falso.conferencia['a3-relatorio'] = 'nao_encontrado'
  }))
  const secao = await secaoDeVersoes()
  expect(await (await itemDoArquivo(secao, PNG_V4)).findByText(ALTERADO)).toBeTruthy()
  expect(await (await itemDoArquivo(secao, RELATORIO_V3)).findByText(NAO_ENCONTRADO)).toBeTruthy()
  expect((await itemDoArquivo(secao, BPMN_V4)).queryByText(/Alterado|Não encontrado/)).toBeNull()
  expect(secao.queryByText(AVISO)).toBeNull()
})

test('a conferência roda uma vez ao abrir a seção', async () => {
  const { versoes } = montarNosCadastros(comVersoes((falso) => { falso.conferencia['a4-png'] = 'alterado' }))
  const secao = await secaoDeVersoes()
  await (await itemDoArquivo(secao, PNG_V4)).findByText(ALTERADO)
  expect(versoes.conferidos).toEqual(['p1'])
})

test('a Consulta também vê as marcas', async () => {
  montarNosCadastros({ perfil: 'consulta', ...comVersoes((falso) => { falso.conferencia['a4-png'] = 'alterado' }) })
  const secao = await secaoDeVersoes()
  expect(await (await itemDoArquivo(secao, PNG_V4)).findByText(ALTERADO)).toBeTruthy()
})

test('se a conferência falha, a lista aparece normal, sem marcas, com o aviso', async () => {
  montarNosCadastros(comVersoes((falso) => {
    falso.conferencia['a4-png'] = 'alterado'
    falso.falharConferencia = true
  }))
  const secao = await secaoDeVersoes()
  expect(await secao.findByText(AVISO)).toBeTruthy()
  expect(secao.getByRole('link', { name: PNG_V4 })).toBeTruthy()
  expect(secao.queryByText(ALTERADO)).toBeNull()
  expect(secao.queryByText(NAO_ENCONTRADO)).toBeNull()
})

test('com tudo certo no Drive, não há marca nem aviso', async () => {
  const { versoes } = montarNosCadastros(comVersoes())
  const secao = await secaoDeVersoes()
  await waitFor(() => expect(versoes.conferidos).toEqual(['p1']))
  expect(secao.queryByText(ALTERADO)).toBeNull()
  expect(secao.queryByText(NAO_ENCONTRADO)).toBeNull()
  expect(secao.queryByText(AVISO)).toBeNull()
})

test('processo sem versões não consulta o Drive', async () => {
  const { versoes } = montarNosCadastros()
  const secao = await secaoDeVersoes()
  expect(await secao.findByText('Nenhuma versão enviada.')).toBeTruthy()
  expect(versoes.conferidos).toEqual([])
})
