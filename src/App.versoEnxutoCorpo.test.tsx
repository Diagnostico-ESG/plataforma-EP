import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { anexoDeTeste, secaoDeAnexos } from './testes/anexosDeTeste'
import { montarNosCadastros } from './testes/processosNosCadastros'
import { versaoDeTeste } from './testes/versoesDeTeste'

// O corpo do verso enxuto (ticket 04 de redesenho-do-quadro): a versão mais recente com o quadro do fluxograma e os arquivos em
// lista vertical, e "Versões anteriores" e "Outros anexos" recolhidos, com a contagem.

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const versoes = async () => {
  const verso = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await verso.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

test('a versão mais recente tem o quadro do fluxograma e os arquivos em lista, cada um com selo do tipo, nome e tamanho', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => { falso.versoes.p1 = [versaoDeTeste(1)] } })
  const v1 = await (await versoes()).findByRole('article', { name: 'V1' })
  expect(v1.querySelector('.versao-destaque-miniatura')).toBeTruthy()
  // o espaço tracejado do relatório que falta também é um item da lista, mas sem selo
  const arquivos = within(v1).getAllByRole('listitem').filter((item) => item.querySelector('.selo-do-tipo'))
  expect(arquivos.map((item) => item.querySelector('.selo-do-tipo')?.textContent)).toEqual(['PNG', 'BPM'])
  expect(arquivos.map((item) => item.querySelector('.arquivo-do-destaque-tamanho')?.textContent)).toEqual(['100 B', '100 B'])
})

test('"Versões anteriores" fica recolhida e mostra a contagem', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => { falso.versoes.p1 = [versaoDeTeste(1), versaoDeTeste(2)] } })
  const resumo = await (await versoes()).findByText('Versões anteriores (1)')
  expect((resumo.closest('details') as HTMLDetailsElement).open).toBe(false)
})

test('"Outros anexos" fica recolhido e mostra a contagem ao lado do título', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => { falso.anexos.anexos.p1 = [anexoDeTeste(1, 'a.pdf'), anexoDeTeste(2, 'b.eml')] } })
  const secao = await secaoDeAnexos()
  const resumo = (await secao.findByRole('heading', { name: 'Outros anexos' })).closest('summary') as HTMLElement
  expect(within(resumo).getByText('2').className).toContain('recolhido-contagem')
  expect((resumo.closest('details') as HTMLDetailsElement).open).toBe(false)
})
