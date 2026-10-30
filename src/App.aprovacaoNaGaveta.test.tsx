import { cleanup, fireEvent, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { Aprovacao } from './revisoes/tipos'
import { escolherNoMenuDoProcesso, gavetaDaEtapa, versoAberto } from './testes/versoDoCartao'
import { arquivoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import { APROVACAO, REVISAO_DO_SETOR, montar, versao, type Falsos } from './testes/aprovacaoNoVerso'
import { BIA } from './testes/processoNoVerso'

// A aprovação na gaveta da etapa, o selo "Aprovada" em Arquivos e o histórico (ticket 03 de revisoes-aprovacao, histórias
// 17 a 20, 24, 25 e 28 a 30). Registrar a aprovação e o aviso de voltar saíram com o andamento livre; o registro volta no
// ticket 05 de revisoes-aprovacao.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// ---- A aprovação na gaveta e o selo em Arquivos

const APROVADA: Aprovacao = {
  id: 'ap1', versao: 8, numeroEprotocolo: 'PROT-2026-0001', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-09',
  registradaPor: BIA.nome, registradaEm: '2026-10-12T15:00:00Z',
}
const aprovadaCom = (mudancas: Partial<Aprovacao>): ((falsos: Falsos) => void) =>
  ({ revisoes }) => { revisoes.aprovacoes.p1 = { ...APROVADA, ...mudancas } }

const comRelatorio = (numero: number) => versaoDeTeste(numero, {
  arquivos: [arquivoDeTeste(numero, 'bpmn', 'bpmn'), arquivoDeTeste(numero, 'png', 'png'), arquivoDeTeste(numero, 'relatorio', 'pdf')],
})
const comAsVersoes = ({ versoes }: Falsos) => { versoes.versoes.p1 = [comRelatorio(7), comRelatorio(8)] }
// A V7 e a V8 com relatório; a V8 é a aprovada.
const aprovadaNasVersoes = (falsos: Falsos) => {
  comAsVersoes(falsos)
  falsos.revisoes.aprovacoes.p1 = APROVADA
  falsos.versoes.aprovadas.p1 = 8
}

test('a gaveta da Aprovação mostra a versão aprovada, o número como link em aba nova, a data e quem registrou', async () => {
  montar(versao(), { ajustar: aprovadaCom({}) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByText('V8 aprovada')).toBeTruthy()
  const link = gaveta.getByRole('link', { name: /^PROT-2026-0001/ }) as HTMLAnchorElement
  expect(link.href).toBe('https://eprotocolo.example/a')
  expect(link.target).toBe('_blank')
  expect(link.textContent).toContain('abre em nova aba')
  expect(link.rel).toBe('noopener noreferrer')
  expect(gaveta.getByText(/09\/10\/2026/)).toBeTruthy()
  expect(gaveta.getByText(/Registrada por Bia Teste/)).toBeTruthy()
})

test('sem link o número é texto; sem número, "Sem número do E-protocolo"; link que não é http não vira link', async () => {
  montar(versao(), { ajustar: aprovadaCom({ link: null }) })
  const semLink = await gavetaDaEtapa(APROVACAO)
  expect(await semLink.findByText(/PROT-2026-0001/)).toBeTruthy()
  expect(semLink.queryByRole('link')).toBeNull()
  cleanup()
  montar(versao(), { ajustar: aprovadaCom({ numeroEprotocolo: null, link: null }) })
  expect(await (await gavetaDaEtapa(APROVACAO)).findByText('Sem número do E-protocolo')).toBeTruthy()
  cleanup()
  montar(versao(), { ajustar: aprovadaCom({ link: 'javascript:alert(1)' }) })
  const perigoso = await gavetaDaEtapa(APROVACAO)
  expect(await perigoso.findByText(/PROT-2026-0001/)).toBeTruthy()
  expect(perigoso.queryByRole('link')).toBeNull()
})

test('sem aprovação a gaveta diz que não há; enquanto carrega, "Carregando…"', async () => {
  montar(versao())
  expect(await (await gavetaDaEtapa(APROVACAO)).findByText('Sem aprovação registrada.')).toBeTruthy()
  cleanup()
  montar(versao(), { ajustar: ({ revisoes }) => { revisoes.segurarLeitura = true } })
  expect(await (await gavetaDaEtapa(APROVACAO)).findByText('Carregando…')).toBeTruthy()
})

test('a falha ao ler a aprovação mostra o aviso com [Tentar de novo], que lê outra vez', async () => {
  const { revisoes } = montar(versao(), { ajustar: ({ revisoes: r }) => { r.falharLeitura = true; r.aprovacoes.p1 = APROVADA } })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect((await gaveta.findByRole('alert')).textContent).toContain('Não foi possível carregar a aprovação. Verifique a conexão e tente de novo.')
  revisoes.falharLeitura = false
  fireEvent.click(gaveta.getByRole('button', { name: 'Tentar de novo' }))
  expect(await gaveta.findByText('V8 aprovada')).toBeTruthy()
  expect(gaveta.queryByRole('alert')).toBeNull()
})

test('só a gaveta da Aprovação traz o registro, e a Consulta com o processo suspenso o vê sem botões de alterar', async () => {
  montar(versao(), { perfil: 'consulta', mudancas: { situacao: 'suspenso' }, ajustar: aprovadaCom({}) })
  const outra = await gavetaDaEtapa(REVISAO_DO_SETOR)
  expect(outra.queryByText('V8 aprovada')).toBeNull()
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByText('V8 aprovada')).toBeTruthy()
  expect(gaveta.queryByRole('button', { name: /Voltar a esta etapa|Corrigir datas/ })).toBeNull()
})

test('o subprocesso mostra a própria aprovação', async () => {
  montar(versao(), { mudancas: { tipo: 'subprocesso' }, ajustar: aprovadaCom({}) })
  expect(await (await gavetaDaEtapa(APROVACAO)).findByText('V8 aprovada')).toBeTruthy()
})

const abrirOsArquivos = async () => within(await (await versoAberto()).findByRole('region', { name: 'Documentos do Mapeamento' }))

test('a versão aprovada tem o selo "Aprovada" e nenhum [Substituir]; a anterior continua com o [Substituir]', async () => {
  montar(versao(), { ajustar: aprovadaNasVersoes })
  const arquivos = await abrirOsArquivos()
  const destaque = within(await arquivos.findByRole('article', { name: 'V8' }))
  expect(destaque.getByText('Aprovada')).toBeTruthy()
  expect(destaque.queryByRole('button', { name: /^Ações de / })).toBeNull()
  fireEvent.click(arquivos.getByText(/Versões anteriores/))
  const anterior = within(arquivos.getByRole('article', { name: 'V7' }))
  expect(anterior.queryByText('Aprovada')).toBeNull()
  expect(anterior.getAllByRole('button', { name: /^Ações de / }).length).toBeGreaterThan(0)
})

test('sem aprovação a versão mais recente mantém o [Substituir] e não tem selo', async () => {
  montar(versao(), { ajustar: comAsVersoes })
  const destaque = within(await (await abrirOsArquivos()).findByRole('article', { name: 'V8' }))
  expect(destaque.queryByText('Aprovada')).toBeNull()
  expect(destaque.getAllByRole('button', { name: /^Ações de / }).length).toBeGreaterThan(0)
})

// ---- O histórico do processo

test('os eventos de aprovação registrada e desfeita aparecem no histórico, com texto próprio', async () => {
  const { falso } = montar(versao())
  const estado = {
    processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', versao: 'V8', numero_eprotocolo: 'PROT-2026-0001',
    link: 'https://eprotocolo.example/a', aprovada_em: '2026-10-12', registrada_por_nome: BIA.nome,
  }
  falso.historicoDosProcessos.p1 = [
    { id: 2, ocorridoEm: '2026-10-13T15:00:00Z', autor: BIA.nome, acao: 'desfazer', entidade: 'aprovacao', entidadeRef: 'p1', antes: estado, depois: null },
    { id: 1, ocorridoEm: '2026-10-12T15:00:00Z', autor: BIA.nome, acao: 'registrar', entidade: 'aprovacao', entidadeRef: 'p1', antes: null, depois: estado },
  ]
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Registrou a aprovação')).toBeTruthy()
  expect(verso.getByText('Desfez a aprovação')).toBeTruthy()
  expect(verso.getAllByText(/Versão aprovada: V8; Número do E-protocolo: PROT-2026-0001/).length).toBe(2)
})
