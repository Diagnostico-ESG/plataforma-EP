import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { Perfil } from './acesso/tipos'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from './processos/tipos'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { cartaoDe, ETAPAS, montar as montarQuadro, processo as processoDoQuadro } from './testes/quadroDeTeste'
import { agoraDoVerso, etapasDoVerso } from './testes/versoDoCartao'
import { VersoesFalso } from './versoes/VersoesFalso'

// Concluir a Aprovação pelo setor pela janela de concluir (versão aprovada, número, link e data do E-protocolo opcionais),
// a aprovação na gaveta, o selo "Aprovada" em Arquivos, o aviso de voltar e o histórico (ticket 03 de revisoes-aprovacao,
// histórias 13 a 20, 24, 25 e 28 a 31).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
const BIA = { id: 'u2', nome: 'Bia Teste' }
const REVISAO_DO_SETOR = 'Revisão pelo setor'
const APROVACAO = 'Aprovação pelo setor'
const PUBLICACAO = 'Publicação'
const TITULO_DA_JANELA = `Concluir ${APROVACAO} e iniciar ${PUBLICACAO}`
const BOTAO_DA_JANELA = `Concluir e iniciar ${PUBLICACAO}`
const COMPLETA = ['bpmn', 'png', 'relatorio'] as const

const versao = (papeis: UltimaVersao['papeis'] = [...COMPLETA]): UltimaVersao =>
  ({ numero: 8, autorId: BIA.id, autorNome: BIA.nome, papeis })

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const CONCLUIDA = { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' } as const

function caminho(publicacao: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso[] {
  return [
    doProcesso(3, 'revisao_interna', 'Revisão interna', CONCLUIDA),
    doProcesso(4, 'revisao_setor', REVISAO_DO_SETOR, CONCLUIDA),
    doProcesso(5, 'aprovacao_setor', APROVACAO, {
      status: 'em_andamento', iniciadaEm: '2026-10-12', responsavelId: EU.id, responsavelNome: EU.nome,
    }),
    doProcesso(6, 'publicacao', PUBLICACAO, publicacao),
  ]
}

function processo(ultimaVersao: UltimaVersao | null, etapas: EtapaDoProcesso[]): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: 'aprovacao_setor', nome: APROVACAO, ordem: 5 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao, etapasDoProcesso: etapas,
  }
}

type Opcoes = { perfil?: Perfil; mudancas?: Partial<ProcessoLido>; publicacao?: Partial<EtapaDoProcesso> }

// O verso do processo no aplicativo inteiro, com a Aprovação em andamento sob quem está na tela.
function montar(ultimaVersao: UltimaVersao | null, { perfil = 'integrante_ep', mudancas = {}, publicacao }: Opcoes = {}) {
  window.location.hash = '#/processos/p1'
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const etapas = caminho(publicacao)
  const falso = new ProcessosFalso()
  falso.processos = [{ ...processo(ultimaVersao, etapas), ...mudancas }]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = etapas.map((etapa) => ({ id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true }))
  const versoes = new VersoesFalso()
  const revisoes = new RevisoesFalso(falso, EU, versoes)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso}
    versoes={versoes} revisoes={revisoes} />)
  return { falso, revisoes, versoes }
}

const abrirAJanela = async (titulo = TITULO_DA_JANELA, concluir = `Concluir ${APROVACAO}`) => {
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: concluir }))
  return within(await screen.findByRole('dialog', { name: titulo }))
}
type Janela = ReturnType<typeof within>
const botao = (janela: Janela, nome = BOTAO_DA_JANELA) => janela.getByRole('button', { name: nome }) as HTMLButtonElement
const campo = (janela: Janela, nome: RegExp) => janela.getByLabelText(nome) as HTMLInputElement

test('a janela mostra a versão aprovada e os três campos opcionais, e conclui sem preencher nada', async () => {
  const { revisoes } = montar(versao())
  const janela = await abrirAJanela()
  expect(janela.getByText('Versão aprovada: V8')).toBeTruthy()
  expect(campo(janela, /Número do E-protocolo/).maxLength).toBe(60)
  expect(campo(janela, /^Link/).maxLength).toBe(500)
  expect(campo(janela, /Data da aprovação/).type).toBe('date')
  expect(botao(janela).disabled).toBe(false)
  fireEvent.click(botao(janela))
  expect(await (await etapasDoVerso()).findByRole('button', { name: `${PUBLICACAO}: atual` })).toBeTruthy()
  expect(revisoes.aprovacoesConcluidas).toMatchObject([{
    andamentoId: 'a5', dados: { numeroEprotocolo: null, link: null, aprovadaEm: null },
  }])
})

test('número, link e data preenchidos vão aparados e a data não passa de hoje', async () => {
  const { revisoes } = montar(versao())
  const janela = await abrirAJanela()
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: '  PROT-2026-0001 ' } })
  fireEvent.change(campo(janela, /^Link/), { target: { value: ' https://eprotocolo.example/a ' } })
  fireEvent.change(campo(janela, /Data da aprovação/), { target: { value: '2026-10-12' } })
  expect(campo(janela, /Data da aprovação/).max).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  fireEvent.click(botao(janela))
  await waitFor(() => expect(revisoes.aprovacoesConcluidas).toMatchObject([{
    dados: { numeroEprotocolo: 'PROT-2026-0001', link: 'https://eprotocolo.example/a', aprovadaEm: '2026-10-12' },
  }]))
})

test.each([
  ['a versão está sem relatório', versao(['bpmn', 'png']), 'A V8 está sem relatório.'],
  ['não há versão', null, 'O processo ainda não tem versão enviada.'],
])('com a versão incompleta (%s) a janela diz o que falta e não deixa concluir', async (_caso, ultima, frase) => {
  const { revisoes } = montar(ultima)
  const janela = await abrirAJanela()
  expect(janela.getByRole('alert').textContent).toBe(frase)
  expect(botao(janela).disabled).toBe(true)
  fireEvent.click(botao(janela))
  expect(revisoes.aprovacoesConcluidas).toEqual([])
})

test('sem etapa pendente depois a janela aparece sem a pergunta do responsável e conclui', async () => {
  const { revisoes } = montar(versao(), { publicacao: { status: 'dispensada', nota: 'Não se aplica', resolvidaEm: '2026-10-11' } })
  const janela = await abrirAJanela(`Concluir ${APROVACAO}`)
  expect(janela.queryByText('Quem fica com a próxima etapa?')).toBeNull()
  expect(janela.getByText('Versão aprovada: V8')).toBeTruthy()
  fireEvent.click(botao(janela, 'Concluir'))
  await waitFor(() => expect(revisoes.aprovacoesConcluidas).toMatchObject([{ andamentoId: 'a5', responsavelId: null }]))
})

test('a recusa do banco aparece em vermelho na janela, que fica aberta com o preenchido', async () => {
  const { revisoes } = montar(versao())
  revisoes.falhaNaGravacao = new TravaDoBanco('O link do E-protocolo precisa começar com http:// ou https://.')
  const janela = await abrirAJanela()
  fireEvent.change(campo(janela, /Número do E-protocolo/), { target: { value: 'PROT-1' } })
  fireEvent.change(campo(janela, /^Link/), { target: { value: 'ftp://x.example' } })
  fireEvent.click(botao(janela))
  expect((await janela.findByRole('alert')).textContent).toBe('O link do E-protocolo precisa começar com http:// ou https://.')
  expect(campo(janela, /Número do E-protocolo/).value).toBe('PROT-1')
  expect(campo(janela, /^Link/).value).toBe('ftp://x.example')
  expect(revisoes.aprovacoesConcluidas).toEqual([])
  revisoes.falhaNaGravacao = null
  fireEvent.change(campo(janela, /^Link/), { target: { value: 'https://x.example' } })
  fireEvent.click(botao(janela))
  await waitFor(() => expect(revisoes.aprovacoesConcluidas).toHaveLength(1))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO_DA_JANELA })).toBeNull())
})

test('a falha de conexão também aparece na janela, e enquanto grava o botão mostra "Salvando…"', async () => {
  const { revisoes } = montar(versao())
  revisoes.falhaNaGravacao = 'falha de conexão simulada'
  const janela = await abrirAJanela()
  fireEvent.click(botao(janela))
  expect((await janela.findByRole('alert')).textContent).toContain('falha de conexão simulada')
  revisoes.falhaNaGravacao = null
  revisoes.segurarGravacao = true
  fireEvent.click(botao(janela))
  const salvando = await janela.findByRole('button', { name: 'Salvando…' }) as HTMLButtonElement
  expect(salvando.disabled).toBe(true)
})

test('Realizada anteriormente na Aprovação, a Revisão pelo setor e o voltar não mostram a versão aprovada', async () => {
  montar(versao())
  const agora = await agoraDoVerso()
  fireEvent.click(agora.getByRole('button', { name: 'Mais ações da etapa' }))
  fireEvent.click(agora.getByRole('menuitem', { name: 'Realizada anteriormente' }))
  const aberta = within(await screen.findByRole('dialog', {
    name: `Registrar ${APROVACAO} como realizada anteriormente e iniciar ${PUBLICACAO}`,
  }))
  expect(aberta.queryByText(/Versão aprovada/)).toBeNull()
})

// ---- Pelo arrastar no Quadro (a Aprovação é a etapa 5 do Quadro de teste; a coluna seguinte é o "E-protocolo")

const coluna = (nome: string) => screen.getByRole('region', { name: nome })
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

// No Quadro de teste a quinta etapa tem o código "aprovacao"; a janela lê o código das etapas do processo.
function aprovacaoNoQuadro(ultimaVersao: UltimaVersao | null) {
  const lido = processoDoQuadro('Emitir Ofício', { posicao: 5, processo: { ultimaVersao } })
  const etapas = lido.etapasDoProcesso.map((etapa) => (etapa.ordem === 5 ? { ...etapa, codigo: 'aprovacao_setor' } : etapa))
  return { ...lido, etapasDoProcesso: etapas }
}

async function soltarNoEProtocolo() {
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  fireEvent.dragOver(coluna(ETAPAS[5].nome), { dataTransfer })
  fireEvent.drop(coluna(ETAPAS[5].nome), { dataTransfer })
}

test('arrastar para concluir a Aprovação abre a mesma janela, com a versão aprovada, e grava', async () => {
  window.location.hash = '#/processos'
  const falso = montarQuadro([aprovacaoNoQuadro(versao())], 'integrante_ep', [EU])
  await soltarNoEProtocolo()
  const janela = within(await screen.findByRole('dialog', { name: `Concluir ${ETAPAS[4].nome} e iniciar ${ETAPAS[5].nome}` }))
  expect(janela.getByText('Versão aprovada: V8')).toBeTruthy()
  fireEvent.click(janela.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[5].nome}` }))
  await waitFor(() => expect(falso.chamadas).toMatchObject([{ acao: 'concluir' }]))
})

test('arrastar com a versão incompleta mostra a frase e não deixa concluir', async () => {
  window.location.hash = '#/processos'
  const falso = montarQuadro([aprovacaoNoQuadro(versao(['bpmn', 'png']))], 'integrante_ep', [EU])
  await soltarNoEProtocolo()
  const janela = within(await screen.findByRole('dialog', { name: `Concluir ${ETAPAS[4].nome} e iniciar ${ETAPAS[5].nome}` }))
  expect(janela.getByText('A V8 está sem relatório.')).toBeTruthy()
  expect((janela.getByRole('button', { name: `Concluir e iniciar ${ETAPAS[5].nome}` }) as HTMLButtonElement).disabled).toBe(true)
  expect(falso.chamadas).toEqual([])
})
