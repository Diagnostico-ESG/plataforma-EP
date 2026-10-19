import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from './processos/tipos'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { cartaoDe, ETAPAS, montar as montarQuadro, processo as processoDoQuadro } from './testes/quadroDeTeste'
import { agoraDoVerso, etapasDoVerso } from './testes/versoDoCartao'
import { VersoesFalso } from './versoes/VersoesFalso'

// Concluir a Revisão interna pela janela de concluir: o Resultado da revisão (sem alteração ou corrigida, com escopo e
// comentário), a prévia das versões, o autor impedido e a gravação juntas (ticket 02 de revisoes-aprovacao, histórias 1 a 9
// e 31).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
const BIA = { id: 'u2', nome: 'Bia Teste' }
const REVISAO_INTERNA = 'Revisão interna'
const REVISAO_DO_SETOR = 'Revisão pelo setor'
const TITULO_DA_JANELA = `Concluir ${REVISAO_INTERNA} e iniciar ${REVISAO_DO_SETOR}`
const BOTAO_DA_JANELA = `Concluir e iniciar ${REVISAO_DO_SETOR}`
const PAPEIS = ['bpmn', 'png', 'relatorio'] as const

const versao = (numero: number, autor: { id: string; nome: string }, anterior?: UltimaVersao['anterior']): UltimaVersao =>
  ({ numero, autorId: autor.id, autorNome: autor.nome, papeis: [...PAPEIS], anterior })

const DE_BIA = versao(7, BIA)
const MINHA_SOBRE_A_DE_BIA = versao(8, EU, { numero: 7, autorId: BIA.id })

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const CAMINHO = [
  doProcesso(3, 'revisao_interna', REVISAO_INTERNA, { status: 'em_andamento', iniciadaEm: '2026-10-13', responsavelId: EU.id, responsavelNome: EU.nome }),
  doProcesso(4, 'revisao_setor', REVISAO_DO_SETOR),
]

function processo(ultimaVersao: UltimaVersao | null): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: 'revisao_interna', nome: REVISAO_INTERNA, ordem: 3 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao, etapasDoProcesso: CAMINHO,
  }
}

// O verso do processo no aplicativo inteiro, com a Revisão interna em andamento sob quem está na tela.
function montar(ultimaVersao: UltimaVersao | null) {
  window.location.hash = '#/processos/p1'
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo(ultimaVersao)]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = CAMINHO.map((etapa) => ({ id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true }))
  const revisoes = new RevisoesFalso(falso, EU)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={cadastros} processos={falso}
    versoes={new VersoesFalso()} revisoes={revisoes} />)
  return { falso, revisoes }
}

const concluirAtual = async () => fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${REVISAO_INTERNA}` }))
const abrirAJanela = async () => {
  await concluirAtual()
  return within(await screen.findByRole('dialog', { name: TITULO_DA_JANELA }))
}
const botao = (janela: ReturnType<typeof within>) => janela.getByRole('button', { name: BOTAO_DA_JANELA }) as HTMLButtonElement
const opcao = (janela: ReturnType<typeof within>, nome: string) => janela.getByRole('radio', { name: nome }) as HTMLInputElement

test('sem alteração: a prévia diz que segue a versão, "corrigida" fica desabilitada com o motivo e o escopo não aparece', async () => {
  montar(DE_BIA)
  const janela = await abrirAJanela()
  expect(janela.getByRole('group', { name: 'Resultado da revisão' })).toBeTruthy()
  expect(opcao(janela, 'Sem alteração: segue a V7').disabled).toBe(false)
  expect(opcao(janela, 'Corrigida').disabled).toBe(true)
  expect(janela.getByText('Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.')).toBeTruthy()
  expect(janela.queryByRole('group', { name: 'Escopo da correção' })).toBeNull()
  expect(botao(janela).disabled).toBe(true)
})

test('escolher "sem alteração" com comentário grava a revisão e conclui a etapa', async () => {
  const { revisoes } = montar(DE_BIA)
  const janela = await abrirAJanela()
  fireEvent.click(opcao(janela, 'Sem alteração: segue a V7'))
  fireEvent.change(janela.getByLabelText('Comentário (opcional)'), { target: { value: '  Conferi  ' } })
  expect(botao(janela).disabled).toBe(false)
  fireEvent.click(botao(janela))
  expect(await (await etapasDoVerso()).findByRole('button', { name: `${REVISAO_DO_SETOR}: atual` })).toBeTruthy()
  expect(revisoes.conclusoes).toMatchObject([{
    andamentoId: 'a3', dados: { resultado: 'sem_alteracao', escopo: null, comentario: 'Conferi' },
  }])
})

test('o comentário é opcional e tem limite de 2.000 caracteres', async () => {
  const { revisoes } = montar(DE_BIA)
  const janela = await abrirAJanela()
  expect((janela.getByLabelText('Comentário (opcional)') as HTMLTextAreaElement).maxLength).toBe(2000)
  fireEvent.click(opcao(janela, 'Sem alteração: segue a V7'))
  fireEvent.click(botao(janela))
  await waitFor(() => expect(revisoes.conclusoes).toMatchObject([{ dados: { comentario: null } }]))
})

test('corrigida: a prévia liga a versão minha à anterior, o escopo aparece e é obrigatório', async () => {
  const { revisoes } = montar(MINHA_SOBRE_A_DE_BIA)
  const janela = await abrirAJanela()
  expect(opcao(janela, 'Sem alteração').disabled).toBe(true)
  expect(janela.getByText('Quem enviou a versão V8 não pode revisá-la.')).toBeTruthy()
  fireEvent.click(opcao(janela, 'Corrigida: a V8, enviada por você, corrige a V7'))
  expect(janela.getByRole('group', { name: 'Escopo da correção' })).toBeTruthy()
  expect(botao(janela).disabled).toBe(true)
  fireEvent.click(janela.getByRole('radio', { name: 'Fluxograma e relatório' }))
  expect(botao(janela).disabled).toBe(false)
  fireEvent.click(botao(janela))
  await waitFor(() => expect(revisoes.conclusoes).toMatchObject([{
    dados: { resultado: 'corrigida', escopo: 'ambos', comentario: null },
  }]))
  expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({ versaoRevisada: 7, versaoCorrigida: 8 })
})

test.each([
  ['a única versão é minha', versao(1, EU)],
  ['as duas versões são minhas', versao(8, EU, { numero: 7, autorId: EU.id })],
])('quem enviou a versão não revisa: a frase aparece e o botão fica desabilitado (%s)', async (_caso, ultima) => {
  const { revisoes } = montar(ultima)
  const janela = await abrirAJanela()
  expect(janela.getByRole('alert').textContent).toBe(`Quem enviou a versão V${ultima.numero} não pode revisá-la.`)
  expect(botao(janela).disabled).toBe(true)
  fireEvent.click(botao(janela))
  expect(revisoes.conclusoes).toEqual([])
})

test('sem versão a janela diz que não há versão e não deixa concluir', async () => {
  montar(null)
  const janela = await abrirAJanela()
  expect(janela.getByRole('alert').textContent).toBe('O processo ainda não tem versão enviada.')
  expect(botao(janela).disabled).toBe(true)
})

test('a recusa do banco aparece em vermelho na janela, que fica aberta com o preenchido', async () => {
  const { revisoes } = montar(DE_BIA)
  revisoes.falhaNaGravacao = new TravaDoBanco('A V7 já foi revisada por outra pessoa.')
  const janela = await abrirAJanela()
  fireEvent.click(opcao(janela, 'Sem alteração: segue a V7'))
  fireEvent.change(janela.getByLabelText('Comentário (opcional)'), { target: { value: 'Conferi' } })
  fireEvent.click(botao(janela))
  expect((await janela.findByRole('alert')).textContent).toBe('A V7 já foi revisada por outra pessoa.')
  expect(opcao(janela, 'Sem alteração: segue a V7').checked).toBe(true)
  expect((janela.getByLabelText('Comentário (opcional)') as HTMLTextAreaElement).value).toBe('Conferi')
  expect(revisoes.conclusoes).toEqual([])
  revisoes.falhaNaGravacao = null
  fireEvent.click(botao(janela))
  await waitFor(() => expect(revisoes.conclusoes).toHaveLength(1))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO_DA_JANELA })).toBeNull())
})

test('a falha de conexão também aparece na janela, sem perder o preenchido', async () => {
  const { revisoes } = montar(DE_BIA)
  revisoes.falhaNaGravacao = 'falha de conexão simulada'
  const janela = await abrirAJanela()
  fireEvent.click(opcao(janela, 'Sem alteração: segue a V7'))
  fireEvent.click(botao(janela))
  expect((await janela.findByRole('alert')).textContent).toContain('falha de conexão simulada')
  expect(opcao(janela, 'Sem alteração: segue a V7').checked).toBe(true)
})

test('enquanto grava, o botão mostra "Salvando…" e fica desabilitado', async () => {
  const { revisoes } = montar(DE_BIA)
  revisoes.segurarGravacao = true
  const janela = await abrirAJanela()
  fireEvent.click(opcao(janela, 'Sem alteração: segue a V7'))
  fireEvent.click(botao(janela))
  const salvando = await janela.findByRole('button', { name: 'Salvando…' }) as HTMLButtonElement
  expect(salvando.disabled).toBe(true)
})

test('Realizada anteriormente na Revisão interna não pede o resultado da revisão', async () => {
  const { revisoes } = montar(DE_BIA)
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(agora.getByRole('menuitem', { name: 'Realizada anteriormente' }))
  const aberta = within(await screen.findByRole('dialog', {
    name: `Registrar ${REVISAO_INTERNA} como realizada anteriormente e iniciar ${REVISAO_DO_SETOR}`,
  }))
  expect(aberta.queryByRole('group', { name: 'Resultado da revisão' })).toBeNull()
  expect(revisoes.conclusoes).toEqual([])
})

// ---- Pelo arrastar no Quadro (a Revisão interna é a etapa 3; a coluna seguinte é a "Revisão do setor" do Quadro de teste)

const coluna = (nome: string) => screen.getByRole('region', { name: nome })
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }
const TITULO_DO_ARRASTAR = `Concluir ${ETAPAS[2].nome} e iniciar ${ETAPAS[3].nome}`

async function soltarNaRevisaoDoSetor() {
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  fireEvent.dragOver(coluna(ETAPAS[3].nome), { dataTransfer })
  fireEvent.drop(coluna(ETAPAS[3].nome), { dataTransfer })
}

test('arrastar para concluir a Revisão interna abre a mesma janela e grava a revisão', async () => {
  window.location.hash = '#/processos'
  const falso = montarQuadro([processoDoQuadro('Emitir Ofício', { posicao: 3, processo: { ultimaVersao: DE_BIA } })], 'integrante_ep', [EU])
  await soltarNaRevisaoDoSetor()
  const janela = within(await screen.findByRole('dialog', { name: TITULO_DO_ARRASTAR }))
  expect((janela.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[3].nome}` }) as HTMLButtonElement).disabled).toBe(true)
  expect(janela.getByRole('radio', { name: 'Sem alteração: segue a V7' })).toBeTruthy()
  fireEvent.click(janela.getByRole('radio', { name: 'Sem alteração: segue a V7' }))
  fireEvent.click(janela.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[3].nome}` }))
  await waitFor(() => expect(falso.chamadas).toMatchObject([{ acao: 'concluir' }]))
})

test('arrastar com a versão minha mostra o escopo e, sem opção que caiba, a frase', async () => {
  window.location.hash = '#/processos'
  montarQuadro([processoDoQuadro('Emitir Ofício', { posicao: 3, processo: { ultimaVersao: versao(1, EU) } })], 'integrante_ep', [EU])
  await soltarNaRevisaoDoSetor()
  const janela = within(await screen.findByRole('dialog', { name: TITULO_DO_ARRASTAR }))
  expect(janela.getByRole('alert').textContent).toBe('Quem enviou a versão V1 não pode revisá-la.')
  expect((janela.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[3].nome}` }) as HTMLButtonElement).disabled).toBe(true)
})
