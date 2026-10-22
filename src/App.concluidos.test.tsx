import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { EtapaDoProcesso, ProcessoLido } from './processos/tipos'
import { APROVACAO, CONCLUIDA, PUBLICACAO, caminho, montar as montarVerso, versao } from './testes/aprovacaoNoVerso'
import { cartaoDe, montar, processo } from './testes/quadroDeTeste'
import { escolherNoMenuDoProcesso, gavetaDaEtapa, janelaPorCima, versoAberto } from './testes/versoDoCartao'

// A coluna Concluídos do Quadro, o selo "Não publicado", o arrastar da Publicação para Concluídos, o aviso da escolha
// apagada na volta e os eventos da escolha no histórico (publicacao-e-arquivamento, ticket 01, histórias 10 a 12, 16 a 22,
// 35 a 37 e 41).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome, fotoUrl: null }

function concluido(nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return processo(nome, { posicao: 6, processo: { situacao: 'concluido', etapaAtual: null, responsavel: null, vaiParaPublicacao: true, ...mudancas } })
}

const concluidos = () => screen.getByRole('region', { name: 'Concluídos' })
const nomesEm = (coluna: HTMLElement) => Array.from(coluna.querySelectorAll('.cartao-nome')).map((nome) => nome.textContent)

test('a coluna Concluídos fica no fim do Quadro, sempre, com a frase quando vazia', async () => {
  window.location.hash = '#/processos'
  montar([processo('Em Curso')])
  await cartaoDe('Em Curso')
  const colunas = screen.getAllByRole('region').filter((regiao) => regiao.classList.contains('coluna'))
  expect(colunas.at(-1)?.getAttribute('aria-label')).toBe('Concluídos')
  expect(within(concluidos()).getByText('Nenhum processo concluído.')).toBeTruthy()
})

test('Concluídos traz os concluídos por nome, com os filtros do Quadro, e o cartão de lá não se arrasta', async () => {
  window.location.hash = '#/processos?setor=s1'
  montar([concluido('Zeta'), concluido('alfa'), concluido('Outro Setor', { setorId: 's2', setorSigla: 'TSB' })])
  await cartaoDe('Zeta')
  expect(nomesEm(concluidos())).toEqual(['alfa', 'Zeta'])
  expect((await cartaoDe('Zeta')).getAttribute('draggable')).toBe('false')
})

test('o concluído com "não" tem o selo Não publicado; o publicado, não', async () => {
  window.location.hash = '#/processos'
  montar([concluido('Sem Publicar', { vaiParaPublicacao: false }), concluido('Publicado')])
  expect(within(await cartaoDe('Sem Publicar')).getByText('Não publicado')).toBeTruthy()
  expect(within(await cartaoDe('Publicado')).queryByText('Não publicado')).toBeNull()
})

test('"Só os meus" e o agrupamento por responsável não trazem concluídos', async () => {
  window.location.hash = `#/processos?responsavel=${EU.id}`
  montar([concluido('Pronto'), processo('Meu', { processo: { responsavel: EU } })])
  await cartaoDe('Meu')
  expect(nomesEm(concluidos())).toEqual([])
  cleanup()
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([concluido('Pronto'), processo('Meu', { processo: { responsavel: EU } })])
  await cartaoDe('Meu')
  expect(screen.queryByRole('region', { name: 'Concluídos' })).toBeNull()
  expect(screen.queryByText('Pronto', { selector: '.cartao-nome' })).toBeNull()
})

// ---- A Publicação em andamento: arrastar para Concluídos abre a janela de concluir a Publicação.

const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

function naPublicacao(): EtapaDoProcesso[] {
  return caminho({ status: 'em_andamento', iniciadaEm: '2026-10-12' })
    .map((etapa) => (etapa.codigo === 'aprovacao_setor' ? { ...etapa, ...CONCLUIDA } : etapa))
}

function comCartao(etapas: EtapaDoProcesso[]): Partial<ProcessoLido> {
  return {
    vaiParaPublicacao: true, etapaAtual: { codigo: 'publicacao', nome: PUBLICACAO, ordem: 6 },
    cartao: {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: '2026-10-12', responsavelAtivo: true, ultimaVersao: null, subprocessos: 0,
      caminho: etapas.map((etapa) => ({ codigo: etapa.codigo, status: etapa.status })),
    },
  }
}

test('arrastar o cartão da Publicação para Concluídos abre a janela de concluir a Publicação e o leva para lá', async () => {
  const etapas = naPublicacao()
  const { falso } = montarVerso(versao(), { etapas, mudancas: comCartao(etapas) })
  window.location.hash = '#/processos'
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  fireEvent.dragOver(concluidos(), { dataTransfer })
  fireEvent.drop(concluidos(), { dataTransfer })
  const janela = within(await screen.findByRole('dialog', { name: `Concluir ${PUBLICACAO}` }))
  fireEvent.click(janela.getByRole('button', { name: 'Concluir' }))
  await waitFor(() => expect(nomesEm(concluidos())).toEqual(['Emitir Ofício']))
  expect(falso.chamadas).toMatchObject([{ acao: 'concluir', id: 'a6' }])
})

// ---- A volta: até a Aprovação apaga a escolha (a janela avisa); à Publicação, a mantém.

async function voltarA(nome: string) {
  fireEvent.click((await gavetaDaEtapa(nome)).getByRole('button', { name: 'Voltar a esta etapa' }))
  return within(await screen.findByRole('dialog', { name: `Voltar à etapa ${nome}?` }))
}

test('voltar à Aprovação avisa que a escolha será apagada; voltar à Publicação não avisa e mantém o "sim"', async () => {
  const etapas = naPublicacao().map((etapa) => (etapa.codigo === 'publicacao' ? { ...etapa, ...CONCLUIDA } : etapa))
  const { falso } = montarVerso(versao(), { etapas, mudancas: { situacao: 'concluido', etapaAtual: null, vaiParaPublicacao: true } })
  expect((await voltarA(APROVACAO)).getByRole('note').textContent).toContain('A escolha de publicação será apagada.')
  fireEvent.click(within(janelaPorCima()).getByRole('button', { name: 'Cancelar' }))
  const janela = await voltarA(PUBLICACAO)
  expect(janela.queryByText(/A escolha de publicação será apagada/)).toBeNull()
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: 'Republicar' } })
  fireEvent.click(janela.getByRole('button', { name: 'Voltar' }))
  await waitFor(() => expect(falso.processos[0]).toMatchObject({ situacao: 'em_andamento', vaiParaPublicacao: true }))
  expect(within(await screen.findByRole('region', { name: PUBLICACAO })).getByText('Emitir Ofício')).toBeTruthy()
})

test('a escolha e a escolha apagada aparecem no histórico do processo', async () => {
  const { falso } = montarVerso(versao())
  const estado = (vai: boolean | null) => ({ nome: 'Emitir Ofício', setor_sigla: 'TSA', vai_para_publicacao: vai })
  falso.historicoDosProcessos.p1 = [
    { id: 2, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Bia Teste', acao: 'apagar_escolha_de_publicacao', entidade: 'processo',
      entidadeRef: 'p1', antes: estado(false), depois: estado(null), motivo: 'Rever a aprovação' },
    { id: 1, ocorridoEm: '2026-10-12T15:00:00Z', autor: 'Bia Teste', acao: 'escolher_publicacao', entidade: 'processo',
      entidadeRef: 'p1', antes: estado(null), depois: estado(false) },
  ]
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Respondeu se o processo vai para publicação')).toBeTruthy()
  expect(verso.getByText('Apagou a escolha de publicação ao voltar a uma etapa')).toBeTruthy()
  expect(verso.getAllByText(/Vai para publicação: Não/).length).toBeGreaterThan(0)
  expect(verso.getByText(/Rever a aprovação/)).toBeTruthy()
})
