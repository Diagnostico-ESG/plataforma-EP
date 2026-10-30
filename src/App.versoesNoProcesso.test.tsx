import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { formatarMomento } from './acesso/historico'
import type { SituacaoDoProcesso } from './processos/tipos'
import { PROCESSOS_DOS_CADASTROS, montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { arquivoDeTeste, relatorioNumeradoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const secao = async () => {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

const comSituacao = (situacao: SituacaoDoProcesso) => ({
  ajustarProcessos: (falso: { processos: typeof PROCESSOS_DOS_CADASTROS }) => {
    falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
  },
})

test('a seção mostra a mais recente em destaque, com rótulo, dia, autor, etapa e arquivos, e as anteriores depois', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => {
    falso.versoes.p1 = [
      versaoDeTeste(1, { arquivos: [arquivoDeTeste(1, 'bpmn', 'bpmn'), ...versaoDeTeste(1).arquivos] }),
      versaoDeTeste(2, {
        autor: 'Bia Teste', etapa: 'Relatório e modelagem técnica',
        arquivos: [arquivoDeTeste(2, 'bpmn', 'bpmn'), arquivoDeTeste(2, 'relatorio', 'pdf'), arquivoDeTeste(2, 'bpm', 'bpm'),
          arquivoDeTeste(2, 'png', 'png')],
      }),
    ]
  } })
  const tela = await secao()
  const versoes = await tela.findAllByRole('article', { name: /^V\d/ })
  expect(versoes.map((versao) => versao.getAttribute('aria-label'))).toEqual(['V2', 'V1'])
  const v2 = within(versoes[0])
  expect(v2.getByText('02/10').getAttribute('title')).toBe(formatarMomento('2026-10-02T13:00:00Z'))
  expect(v2.getByText('Bia Teste')).toBeTruthy()
  expect(v2.getByText('Relatório e modelagem técnica')).toBeTruthy()
  // Na ordem .png, .bpm, relatório e .bpmn, no destaque e nas anteriores.
  expect(v2.getAllByRole('link').map((link) => link.getAttribute('title'))).toEqual([
    'TSA_V2_Emitir Ofício.png', 'TSA_V2_Emitir Ofício.bpm', 'TSA_V2_Emitir Ofício_Relatório.pdf', 'TSA_V2_Emitir Ofício.bpmn',
  ])
  expect(within(versoes[1]).getAllByRole('link').map((link) => link.textContent)).toEqual([
    'TSA_V1_Emitir Ofício.png', 'TSA_V1_Emitir Ofício.bpm', 'TSA_V1_Emitir Ofício.bpmn',
  ])
})

test('no destaque, o relatório fica no lugar dele, depois do .bpm e antes do .bpmn', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => {
    falso.versoes.p1 = [versaoDeTeste(1, {
      arquivos: [arquivoDeTeste(1, 'bpmn', 'bpmn'), relatorioNumeradoDeTeste(1, 1), ...versaoDeTeste(1).arquivos],
    })]
  } })
  const v1 = await (await secao()).findByRole('article', { name: 'V1' })
  const texto = v1.textContent ?? ''
  const posicoes = ['Imagem .png', 'Fluxograma .bpm', 'Relatório V1', 'BPMN .bpmn'].map((trecho) => texto.indexOf(trecho))
  expect(posicoes.every((posicao) => posicao >= 0)).toBe(true)
  expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
})

test('o subprocesso tem a sua seção Versões', async () => {
  window.location.hash = '#/processos/p4'
  montarNosCadastros({
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) =>
        processo.id === 'p4' ? { ...processo, tipo: 'subprocesso', processoPaiId: 'p1' } : processo)
    },
    ajustarVersoes: (falso) => { falso.versoes.p4 = [versaoDeTeste(1)] },
  })
  expect(await (await secao()).findByRole('article', { name: 'V1' })).toBeTruthy()
})

test('sem versão, a seção diz "Nenhuma versão enviada." e mostra [Enviar versão] a quem pode, na Revisão interna', async () => {
  montarNosCadastros({ ajustarProcessos: naEtapa('revisao_interna') })
  const tela = await secao()
  expect(await tela.findByText('Nenhuma versão enviada.')).toBeTruthy()
  expect(tela.getByRole('button', { name: 'Enviar versão' })).toBeTruthy()
})

test('enquanto as versões carregam, a seção mostra "Carregando…"', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => { falso.segurarLeitura = true } })
  expect((await (await secao()).findByRole('status')).textContent).toBe('Carregando…')
})

test('se a leitura falha, mostra o erro e [Tentar de novo] recarrega', async () => {
  const { versoes } = montarNosCadastros({ ajustarVersoes: (falso) => {
    falso.falharLeitura = true
    falso.versoes.p1 = [versaoDeTeste(1)]
  } })
  const tela = await secao()
  expect(await tela.findByText('Não foi possível carregar as versões. Verifique a conexão e tente de novo.')).toBeTruthy()
  versoes.falharLeitura = false
  fireEvent.click(tela.getByRole('button', { name: 'Tentar de novo' }))
  expect(await tela.findByRole('article', { name: 'V1' })).toBeTruthy()
})

test('a Consulta vê as versões, sem [Enviar versão]', async () => {
  montarNosCadastros({
    perfil: 'consulta', ajustarProcessos: naEtapa('revisao_interna'), ajustarVersoes: (falso) => { falso.versoes.p1 = [versaoDeTeste(1)] },
  })
  const tela = await secao()
  expect(await tela.findByRole('article', { name: 'V1' })).toBeTruthy()
  expect(tela.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s mostra as versões, sem [Enviar versão]', async (situacao) => {
  montarNosCadastros({
    ajustarProcessos: (falso) => {
      naEtapa('revisao_interna')(falso)
      comSituacao(situacao).ajustarProcessos(falso)
    },
    ajustarVersoes: (falso) => { falso.versoes.p1 = [versaoDeTeste(1)] },
  })
  const tela = await secao()
  expect(await tela.findByRole('article', { name: 'V1' })).toBeTruthy()
  expect(tela.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})
