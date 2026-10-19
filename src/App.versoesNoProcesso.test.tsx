import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { formatarMomento } from './acesso/historico'
import type { SituacaoDoProcesso } from './processos/tipos'
import { PROCESSOS_DOS_CADASTROS, montarNosCadastros } from './testes/processosNosCadastros'
import { arquivoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const secao = async () => {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Versões do processo' }))
}

const comSituacao = (situacao: SituacaoDoProcesso) => ({
  ajustarProcessos: (falso: { processos: typeof PROCESSOS_DOS_CADASTROS }) => {
    falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
  },
})

test('a seção mostra as versões da mais recente para a mais antiga, com rótulo, data, autor, etapa, observação e arquivos', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => {
    falso.versoes.p1 = [
      versaoDeTeste(1),
      versaoDeTeste(2, {
        autor: 'Bia Teste', etapa: 'Relatório e modelagem técnica', observacao: 'Ajustada a raia do setor',
        arquivos: [arquivoDeTeste(2, 'bpmn', 'bpmn'), arquivoDeTeste(2, 'png', 'png'), arquivoDeTeste(2, 'relatorio', 'pdf')],
      }),
    ]
  } })
  const tela = await secao()
  const versoes = await tela.findAllByRole('listitem', { name: /^V\d/ })
  expect(versoes.map((versao) => versao.getAttribute('aria-label'))).toEqual(['V2', 'V1'])
  const v2 = within(versoes[0])
  expect(v2.getByText(formatarMomento('2026-10-02T13:00:00Z'))).toBeTruthy()
  expect(v2.getByText('Bia Teste')).toBeTruthy()
  expect(v2.getByText('Relatório e modelagem técnica')).toBeTruthy()
  expect(v2.getByText('Ajustada a raia do setor')).toBeTruthy()
  expect(v2.getAllByRole('link').map((link) => link.textContent)).toEqual([
    'TSA_V2_Emitir Ofício.bpmn', 'TSA_V2_Emitir Ofício.png', 'TSA_V2_Emitir Ofício_Relatório.pdf',
  ])
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
  expect(await (await secao()).findByRole('listitem', { name: 'V1' })).toBeTruthy()
})

test('sem versão, a seção diz "Nenhuma versão enviada." e mostra [Enviar versão] a quem pode', async () => {
  montarNosCadastros()
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
  expect(await tela.findByRole('listitem', { name: 'V1' })).toBeTruthy()
})

test('a Consulta vê as versões, sem [Enviar versão]', async () => {
  montarNosCadastros({ perfil: 'consulta', ajustarVersoes: (falso) => { falso.versoes.p1 = [versaoDeTeste(1)] } })
  const tela = await secao()
  expect(await tela.findByRole('listitem', { name: 'V1' })).toBeTruthy()
  expect(tela.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s mostra as versões, sem [Enviar versão]', async (situacao) => {
  montarNosCadastros({ ...comSituacao(situacao), ajustarVersoes: (falso) => { falso.versoes.p1 = [versaoDeTeste(1)] } })
  const tela = await secao()
  expect(await tela.findByRole('listitem', { name: 'V1' })).toBeTruthy()
  expect(tela.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})
