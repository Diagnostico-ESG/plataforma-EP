import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { agoraDoVerso, etapasDoVerso } from './testes/versoDoCartao'
import { cartaoDe, ETAPAS, montar as montarQuadro, processo as processoDoQuadro } from './testes/quadroDeTeste'

// Concluir a Revisão pelo setor exige a versão mais recente completa (.bpmn, .png e relatório): a janela diz o que
// falta e não deixa concluir (ticket 01 de revisoes-aprovacao, histórias 11 e 12).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const REVISAO_DO_SETOR = 'Revisão pelo setor'
const APROVACAO = 'Aprovação pelo setor'
const TITULO_DA_JANELA = `Concluir ${REVISAO_DO_SETOR} e iniciar ${APROVACAO}`
const BOTAO_DA_JANELA = `Concluir e iniciar ${APROVACAO}`
const COMPLETA = ['bpmn', 'png', 'relatorio'] as const

const versao = (papeis: UltimaVersao['papeis']): UltimaVersao => ({ numero: 8, autorId: 'u2', autorNome: 'Bia Teste', papeis })

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const CONCLUIDA = { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' } as const
const EM_ANDAMENTO = { status: 'em_andamento', iniciadaEm: '2026-10-13' } as const

const CAMINHO = [
  doProcesso(3, 'revisao_interna', 'Revisão interna', CONCLUIDA),
  doProcesso(4, 'revisao_setor', REVISAO_DO_SETOR, EM_ANDAMENTO),
  doProcesso(5, 'aprovacao_setor', APROVACAO),
]

function processo(ultimaVersao: UltimaVersao | null): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: 'revisao_setor', nome: REVISAO_DO_SETOR, ordem: 4 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao, etapasDoProcesso: CAMINHO,
  }
}

// O verso do processo no aplicativo inteiro, com a Revisão pelo setor em andamento.
function montar(ultimaVersao: UltimaVersao | null, falha?: string | Error): ProcessosFalso {
  window.location.hash = '#/processos/p1'
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo(ultimaVersao)]
  falso.usuariosPossiveis = [{ id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }]
  falso.etapasDoCatalogo = CAMINHO.map((etapa) => ({ id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true }))
  if (falha) falso.falhaDeGravacao = falha
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'integrante_ep' })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} />)
  return falso
}

const concluirAtual = async () => fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${REVISAO_DO_SETOR}` }))
const janela = async () => within(await screen.findByRole('dialog', { name: TITULO_DA_JANELA }))

test.each([
  ['sem relatório', versao(['bpmn', 'png']), 'A V8 está sem relatório.'],
  ['sem .png e relatório', versao(['bpmn']), 'A V8 está sem .png e relatório.'],
  ['sem versão', null, 'O processo ainda não tem versão enviada.'],
])('a janela de concluir diz o que falta e não deixa concluir (%s)', async (_caso, ultimaVersao, frase) => {
  const falso = montar(ultimaVersao)
  await concluirAtual()
  const aberta = await janela()
  expect(aberta.getByText(frase)).toBeTruthy()
  const botao = aberta.getByRole('button', { name: BOTAO_DA_JANELA }) as HTMLButtonElement
  expect(botao.disabled).toBe(true)
  fireEvent.click(botao)
  expect(falso.chamadas).toEqual([])
})

test('com a versão completa a janela não traz aviso e o Concluir inicia a Aprovação', async () => {
  const falso = montar(versao([...COMPLETA]))
  await concluirAtual()
  const aberta = await janela()
  expect(aberta.queryByText(/está sem|ainda não tem versão/)).toBeNull()
  fireEvent.click(aberta.getByRole('button', { name: BOTAO_DA_JANELA }))
  expect(await (await etapasDoVerso()).findByRole('button', { name: `${APROVACAO}: atual` })).toBeTruthy()
  expect(falso.chamadas).toMatchObject([{ acao: 'concluir', id: 'a4' }])
})

test('a recusa que vem do banco por outro caminho aparece em vermelho e nada muda', async () => {
  // A janela abre com a versão completa (a tela estava desatualizada); o banco recusa ao gravar.
  const falso = montar(versao([...COMPLETA]), new TravaDoBanco('A V9 está sem relatório.'))
  await concluirAtual()
  fireEvent.click((await janela()).getByRole('button', { name: BOTAO_DA_JANELA }))
  const verso = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  expect((await verso.findByRole('alert')).textContent).toBe('A V9 está sem relatório.')
  expect(falso.chamadas).toEqual([])
})

test('Realizada anteriormente na Revisão pelo setor não depende de versão', async () => {
  const falso = montar(null)
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(agora.getByRole('menuitem', { name: 'Realizada anteriormente' }))
  const aberta = within(await screen.findByRole('dialog', { name: `Registrar ${REVISAO_DO_SETOR} como realizada anteriormente e iniciar ${APROVACAO}` }))
  expect(aberta.queryByText(/ainda não tem versão/)).toBeNull()
  fireEvent.change(aberta.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(aberta.getByRole('button', { name: `Registrar e iniciar ${APROVACAO}` }))
  await waitFor(() => expect(falso.chamadas).toMatchObject([{ acao: 'realizada', id: 'a4' }]))
})

// ---- Pelo arrastar no Quadro

const coluna = (nome: string) => screen.getByRole('region', { name: nome })
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

// No Quadro de teste a quarta etapa tem o código "revisao_do_setor"; a janela lê o código das etapas do processo.
function revisaoDoSetorNoQuadro(ultimaVersao: UltimaVersao | null) {
  const lido = processoDoQuadro('Emitir Ofício', { posicao: 4, processo: { ultimaVersao } })
  const etapas = lido.etapasDoProcesso.map((etapa) => (etapa.ordem === 4 ? { ...etapa, codigo: 'revisao_setor' } : etapa))
  return { ...lido, etapasDoProcesso: etapas }
}

async function soltarNaAprovacao() {
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  fireEvent.dragOver(coluna('Aprovação'), { dataTransfer })
  fireEvent.drop(coluna('Aprovação'), { dataTransfer })
}

test('arrastar para concluir a Revisão do setor com versão incompleta mostra a frase e não deixa concluir', async () => {
  window.location.hash = '#/processos'
  const falso = montarQuadro([revisaoDoSetorNoQuadro(versao(['bpmn', 'png']))], 'integrante_ep', [{ id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }])
  await soltarNaAprovacao()
  const aberta = within(await screen.findByRole('dialog', { name: `Concluir ${ETAPAS[3].nome} e iniciar ${ETAPAS[4].nome}` }))
  expect(aberta.getByText('A V8 está sem relatório.')).toBeTruthy()
  expect((aberta.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[4].nome}` }) as HTMLButtonElement).disabled).toBe(true)
  expect(falso.chamadas).toEqual([])
})

test('arrastar com a versão completa abre a janela sem aviso e conclui', async () => {
  window.location.hash = '#/processos'
  const falso = montarQuadro([revisaoDoSetorNoQuadro(versao([...COMPLETA]))], 'integrante_ep', [{ id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }])
  await soltarNaAprovacao()
  const aberta = within(await screen.findByRole('dialog', { name: `Concluir ${ETAPAS[3].nome} e iniciar ${ETAPAS[4].nome}` }))
  expect(aberta.queryByText(/está sem/)).toBeNull()
  fireEvent.click(aberta.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[4].nome}` }))
  await waitFor(() => expect(falso.chamadas).toMatchObject([{ acao: 'concluir' }]))
})

