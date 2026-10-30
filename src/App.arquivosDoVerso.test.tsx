import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { SituacaoDoProcesso } from './processos/tipos'
import { montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { arquivoDeTeste, comNome, relatorioNumeradoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import type { Versao } from './versoes/tipos'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const comRelatorio = (numero: number) => versaoDeTeste(numero, {
  arquivos: [arquivoDeTeste(numero, 'bpm', 'bpm'), arquivoDeTeste(numero, 'png', 'png'), arquivoDeTeste(numero, 'relatorio', 'pdf'),
    arquivoDeTeste(numero, 'bpmn', 'bpmn')],
})
const historica = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})
const comVersoes = (versoes: Versao[], perfil: 'integrante_ep' | 'consulta' = 'integrante_ep') => ({
  perfil, ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = versoes },
})

async function arquivos() {
  const verso = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await verso.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

type Secao = Awaited<ReturnType<typeof arquivos>>

async function destaque(secao: Secao, rotulo: string) {
  const versao = await secao.findByRole('article', { name: rotulo })
  expect(versao.closest('details')).toBeNull()
  return within(versao)
}

function itensDoMenu(secao: Secao, rotulo: string): string[] {
  fireEvent.click(secao.getByRole('button', { name: rotulo }))
  return screen.getAllByRole('menuitem').map((item) => item.textContent ?? '')
}

test('a versão mais recente em destaque: "V2 · 02/10", os botões dos arquivos, sem marca de relatório pendente', async () => {
  montarNosCadastros(comVersoes([versaoDeTeste(1), versaoDeTeste(2)]))
  const v2 = await destaque(await arquivos(), 'V2')
  expect(v2.getByText('V2')).toBeTruthy()
  expect(v2.getByText('02/10').tagName).toBe('TIME')
  expect(v2.queryByText('falta relatório')).toBeNull()
  expect(v2.getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
    'Baixar Imagem .png (TSA_V2_Emitir Ofício.png)', 'Baixar Fluxograma .bpm (TSA_V2_Emitir Ofício.bpm)',
  ])
  expect(v2.getByRole('link', { name: comNome('TSA_V2_Emitir Ofício.bpm') }).textContent).toContain('Fluxograma .bpm')
})

test('a versão sem relatório próprio mostra o último, dizendo de qual versão ele é: "Relatório V1 (da V1)"', async () => {
  const v1 = versaoDeTeste(1, { arquivos: [...versaoDeTeste(1).arquivos, relatorioNumeradoDeTeste(1, 1)] })
  montarNosCadastros(comVersoes([v1, versaoDeTeste(2)]))
  const v2 = await destaque(await arquivos(), 'V2')
  expect(v2.getByRole('link', { name: comNome('Relatório V1 (da V1)') })).toBeTruthy()
  expect(v2.queryByRole('button', { name: 'Acrescentar relatório' })).toBeNull()
})

test('com relatório, sem a pílula nem o espaço, e com o botão do relatório', async () => {
  montarNosCadastros(comVersoes([comRelatorio(1)]))
  const v1 = await destaque(await arquivos(), 'V1')
  expect(v1.queryByText('falta relatório')).toBeNull()
  expect(v1.queryByRole('button', { name: 'Acrescentar relatório' })).toBeNull()
  expect(v1.getByRole('link', { name: 'Baixar Relatório .pdf (TSA_V1_Emitir Ofício_Relatório.pdf)' })).toBeTruthy()
})

test('versão histórica em destaque: "Histórica · somente leitura", sem "falta relatório" nem Substituir', async () => {
  montarNosCadastros(comVersoes([historica(5)]))
  const v5f = await destaque(await arquivos(), 'V5F')
  expect(v5f.getByText('Histórica · somente leitura')).toBeTruthy()
  expect(v5f.queryByText('falta relatório')).toBeNull()
  expect(v5f.queryByRole('button', { name: /^Ações de/ })).toBeNull()
})

test('as anteriores ficam recolhidas em "Versões anteriores (2)", da mais recente para a mais antiga', async () => {
  montarNosCadastros(comVersoes([historica(1), versaoDeTeste(2), comRelatorio(3)]))
  const secao = await arquivos()
  await destaque(secao, 'V3')
  const recolhidas = secao.getByText('Versões anteriores (2)').closest('details') as HTMLDetailsElement
  expect(recolhidas.open).toBe(false)
  expect(within(recolhidas).getAllByRole('article').map((versao) => versao.getAttribute('aria-label'))).toEqual(['V2', 'V1F'])
})

test('[Registrar versão histórica] é o botão de Não iniciados, só sem versão piloto nem em sequência, e não está no "⋯"', async () => {
  montarNosCadastros({ ...comVersoes([historica(1)]), ajustarProcessos: naEtapa('nao_iniciados') })
  const secao = await arquivos()
  await destaque(secao, 'V1F')
  fireEvent.click(secao.getByRole('button', { name: 'Registrar versão histórica' }))
  expect(await secao.findByRole('form', { name: 'Registrar versão histórica' })).toBeTruthy()
  expect(secao.queryByRole('button', { name: 'Mais ações dos arquivos' })).toBeNull()
})

test('sem ação rara, a seção não tem "⋯"', async () => {
  montarNosCadastros(comVersoes([comRelatorio(1), comRelatorio(2)]))
  const secao = await arquivos()
  await destaque(secao, 'V2')
  expect(secao.queryByRole('button', { name: 'Mais ações dos arquivos' })).toBeNull()
})

test('o "⋯" de cada arquivo tem Substituir, que abre a troca no lugar', async () => {
  montarNosCadastros(comVersoes([comRelatorio(2)]))
  const secao = await arquivos()
  await destaque(secao, 'V2')
  expect(itensDoMenu(secao, 'Ações de TSA_V2_Emitir Ofício.bpmn')).toEqual(['Substituir'])
  fireEvent.click(screen.getByRole('menuitem', { name: 'Substituir' }))
  expect(await secao.findByRole('form', { name: 'Substituir TSA_V2_Emitir Ofício.bpmn' })).toBeTruthy()
})

test('a Consulta só baixa: sem [Enviar versão], "⋯" nem o espaço do relatório', async () => {
  montarNosCadastros(comVersoes([historica(1), versaoDeTeste(2)], 'consulta'))
  const secao = await arquivos()
  const v2 = await destaque(secao, 'V2')
  expect(v2.getAllByRole('link')).toHaveLength(2)
  expect(secao.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
  expect(secao.queryByRole('button', { name: 'Mais ações dos arquivos' })).toBeNull()
  expect(secao.queryByRole('button', { name: /^Ações de/ })).toBeNull()
  expect(secao.queryByRole('button', { name: 'Acrescentar relatório' })).toBeNull()
})

test.each<SituacaoDoProcesso>(['suspenso', 'cancelado'])('processo %s só baixa os arquivos', async (situacao) => {
  montarNosCadastros({
    ...comVersoes([versaoDeTeste(1), versaoDeTeste(2)]),
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  })
  const secao = await arquivos()
  await destaque(secao, 'V2')
  expect(secao.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
  expect(secao.queryByRole('button', { name: /^Ações de/ })).toBeNull()
  expect(secao.queryByRole('button', { name: 'Acrescentar relatório' })).toBeNull()
})
