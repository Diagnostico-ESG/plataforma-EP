import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao, UsuarioResponsavel } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { agoraDoVerso, etapasDoVerso, gavetaDaEtapa, janelasPorCima } from './testes/versoDoCartao'

// [Assumir], a trava do autor da versão mais recente na Revisão interna e voltar com a escolha do responsável
// (ticket 14 de processos-etapas, ADR 0014).

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU: UsuarioResponsavel = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }
const VERSAO_DA_BIA: UltimaVersao = { numero: 3, autorId: 'u2', autorNome: 'Bia Teste' }
const VERSAO_DE_EU: UltimaVersao = { numero: 3, autorId: EU.id, autorNome: EU.nome }
const FRASE_DA_BIA = 'Bia Teste enviou a versão V3 e não pode ser responsável pela Revisão interna.'

const MODELAGEM = 'Reunião de modelagem'
const RELATORIO = 'Relatório e modelagem técnica'
const REVISAO = 'Revisão interna'
const PUBLICACAO = 'Publicação'

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const CONCLUIDA = { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' } as const
const EM_ANDAMENTO = { status: 'em_andamento', iniciadaEm: '2026-10-13' } as const

// A modelagem concluída, o relatório em andamento, a revisão interna e a publicação (opcional) pendentes.
const CAMINHO = [
  doProcesso(4, 'modelagem', MODELAGEM, CONCLUIDA),
  doProcesso(5, 'relatorio', RELATORIO, EM_ANDAMENTO),
  doProcesso(6, 'revisao_interna', REVISAO),
  doProcesso(9, 'publicacao', PUBLICACAO, { obrigatoria: false }),
]

// As três primeiras resolvidas e a publicação pendente: dá para voltar à Revisão interna.
const CAMINHO_COM_REVISAO_CONCLUIDA = [
  doProcesso(4, 'modelagem', MODELAGEM, CONCLUIDA),
  doProcesso(5, 'relatorio', RELATORIO, CONCLUIDA),
  doProcesso(6, 'revisao_interna', REVISAO, { ...CONCLUIDA, responsavelId: 'u2', responsavelNome: 'Bia Teste' }),
  doProcesso(9, 'publicacao', PUBLICACAO, { obrigatoria: false }),
]

function processo(etapas: EtapaDoProcesso[], ultimaVersao: UltimaVersao | null): ProcessoLido {
  const atual = etapas.find((etapa) => etapa.status === 'em_andamento' || etapa.status === 'pendente') ?? etapas[0]
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao, etapasDoProcesso: etapas,
  }
}

type Montagem = { perfil?: Perfil; ultimaVersao?: UltimaVersao | null; falha?: string | Error }

function montar(etapas: EtapaDoProcesso[] = CAMINHO, { perfil = 'integrante_ep', ultimaVersao = null, falha }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo(etapas, ultimaVersao)]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = etapas.map((etapa) => ({ id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true }))
  if (falha) falso.falhaDeGravacao = falha
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}

const painel = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
// A gaveta da etapa, aberta pela linha dela.
const etapa = gavetaDaEtapa
// A linha da etapa na lista, pelo nome acessível "{nome}: {status}".
const linha = async (nome: string, status: string) => (await etapasDoVerso()).findByRole('button', { name: `${nome}: ${status}` })
const concluirAtual = async (nome: string) =>
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: `Concluir ${nome}` }))
const janela = (titulo: string) => within(screen.getByRole('dialog', { name: titulo }))
const opcoes = (aberta: ReturnType<typeof janela>) =>
  aberta.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)
const marcado = (aberta: ReturnType<typeof janela>) =>
  (aberta.getAllByRole('radio') as HTMLInputElement[]).find((radio) => radio.checked)?.closest('label')?.textContent
// O [Assumir] da etapa atual fica no Agora; o das outras pendentes, na gaveta.
async function assumir(nomeDaEtapa: string) {
  const agora = await agoraDoVerso()
  const botao = { name: `Assumir ${nomeDaEtapa}` }
  if (agora.queryByRole('heading', { name: nomeDaEtapa })) return agora.queryByRole('button', botao)
  return (await gavetaDaEtapa(nomeDaEtapa)).queryByRole('button', botao)
}

// ---- [Assumir]

test('[Assumir] aparece na etapa em andamento e na pendente sem responsável, e não na resolvida', async () => {
  montar()
  expect(await assumir(RELATORIO)).toBeTruthy()
  expect(await assumir(REVISAO)).toBeTruthy()
  expect(await assumir(PUBLICACAO)).toBeTruthy()
  expect(await assumir(MODELAGEM)).toBeNull()
})

test('[Assumir] não aparece na etapa que já tem responsável', async () => {
  montar([CAMINHO[0], { ...CAMINHO[1], responsavelId: 'u2', responsavelNome: 'Bia Teste' }, CAMINHO[2], CAMINHO[3]])
  expect(await assumir(RELATORIO)).toBeNull()
  expect(await assumir(REVISAO)).toBeTruthy()
})

test('a Consulta não vê [Assumir]', async () => {
  montar(CAMINHO, { perfil: 'consulta' })
  await agoraDoVerso()
  expect(screen.queryByRole('button', { name: /^Assumir/ })).toBeNull()
})

test('um clique em [Assumir] põe quem está na tela como responsável da etapa, e o botão some', async () => {
  const falso = montar()
  const botao = await assumir(RELATORIO)
  fireEvent.click(botao as HTMLElement)
  expect(await (await agoraDoVerso()).findByText(EU.nome)).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a5', usuarioId: EU.id }])
  expect(await assumir(RELATORIO)).toBeNull()
})

test('na Revisão interna, o autor da versão mais recente não vê [Assumir]; outro usuário vê', async () => {
  montar(CAMINHO, { ultimaVersao: VERSAO_DE_EU })
  expect(await assumir(REVISAO)).toBeNull()
  expect(await assumir(RELATORIO)).toBeTruthy()
  cleanup()
  montar(CAMINHO, { ultimaVersao: VERSAO_DA_BIA })
  expect(await assumir(REVISAO)).toBeTruthy()
})

// ---- Janela de avanço sem o autor

test('a janela de avanço com a Revisão interna como próxima não traz o autor da versão mais recente', async () => {
  montar(CAMINHO, { ultimaVersao: VERSAO_DA_BIA })
  await concluirAtual(RELATORIO)
  expect(opcoes(janela(`Concluir ${RELATORIO} e iniciar ${REVISAO}`))).toEqual([EU.nome, 'Ninguém por enquanto'])
})

test('sem versão não histórica, a janela de avanço traz todos', async () => {
  montar(CAMINHO, { ultimaVersao: null })
  await concluirAtual(RELATORIO)
  expect(opcoes(janela(`Concluir ${RELATORIO} e iniciar ${REVISAO}`))).toEqual([EU.nome, BIA.nome, 'Ninguém por enquanto'])
})

test('quando quem conclui é o autor, a janela vem com "Ninguém por enquanto" ou com o responsável que a etapa já tem', async () => {
  montar(CAMINHO, { ultimaVersao: VERSAO_DE_EU })
  await concluirAtual(RELATORIO)
  expect(marcado(janela(`Concluir ${RELATORIO} e iniciar ${REVISAO}`))).toBe('Ninguém por enquanto')
  cleanup()
  montar([CAMINHO[0], CAMINHO[1], { ...CAMINHO[2], responsavelId: 'u2', responsavelNome: 'Bia Teste' }, CAMINHO[3]], { ultimaVersao: VERSAO_DE_EU })
  await concluirAtual(RELATORIO)
  expect(marcado(janela(`Concluir ${RELATORIO} e iniciar ${REVISAO}`))).toBe('Bia Teste')
})

test('o autor que já era o responsável da próxima (escolhido antes da versão) sai da lista e a janela marca ninguém', async () => {
  montar([CAMINHO[0], CAMINHO[1], { ...CAMINHO[2], responsavelId: EU.id, responsavelNome: EU.nome }, CAMINHO[3]], { ultimaVersao: VERSAO_DE_EU })
  await concluirAtual(RELATORIO)
  const aberta = janela(`Concluir ${RELATORIO} e iniciar ${REVISAO}`)
  expect(opcoes(aberta)).toEqual([BIA.nome, 'Ninguém por enquanto'])
  expect(marcado(aberta)).toBe('Ninguém por enquanto')
})

// ---- Seletor de responsável

test('o Trocar da Revisão interna não oferece o autor da versão mais recente e grava quem está na tela', async () => {
  const falso = montar(CAMINHO, { ultimaVersao: VERSAO_DA_BIA })
  const gaveta = await etapa(REVISAO)
  fireEvent.click(gaveta.getByRole('button', { name: `Trocar o responsável de ${REVISAO}` }))
  const seletor = gaveta.getByRole('combobox', { name: `Responsável de ${REVISAO}` })
  expect(within(seletor).getAllByRole('option').map((opcao) => opcao.textContent)).toEqual([`${EU.nome} (você)`, 'Ninguém por enquanto'])
  fireEvent.change(seletor, { target: { value: EU.id } })
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a6', usuarioId: EU.id }]))
  expect(await gaveta.findByText(`Responsável: ${EU.nome}`)).toBeTruthy()
})

test('a recusa do banco ao escolher no Trocar aparece como alerta e mantém o responsável', async () => {
  const falso = montar(CAMINHO, { falha: new TravaDoBanco(FRASE_DA_BIA) })
  const gaveta = await etapa(REVISAO)
  fireEvent.click(gaveta.getByRole('button', { name: `Trocar o responsável de ${REVISAO}` }))
  fireEvent.change(gaveta.getByRole('combobox', { name: `Responsável de ${REVISAO}` }), { target: { value: EU.id } })
  expect((await (await painel()).findByRole('alert')).textContent).toBe(FRASE_DA_BIA)
  expect(gaveta.getByText('Responsável: —')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})

// ---- Janela de voltar

async function abrirVoltar(nome: string) {
  fireEvent.click((await etapa(nome)).getByRole('button', { name: 'Voltar a esta etapa' }))
  return janela(`Voltar à etapa ${nome}?`)
}

test('voltar abre a janela com o motivo e "Quem fica com esta etapa?", com o responsável atual marcado', async () => {
  const falso = montar(CAMINHO_COM_REVISAO_CONCLUIDA)
  const aberta = await abrirVoltar(REVISAO)
  expect(aberta.getByRole('radiogroup', { name: 'Quem fica com esta etapa?' })).toBeTruthy()
  expect(opcoes(aberta)).toEqual([EU.nome, BIA.nome, 'Ninguém por enquanto'])
  expect(marcado(aberta)).toBe(BIA.nome)
  expect((aberta.getByRole('button', { name: 'Voltar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(aberta.getByLabelText('Motivo'), { target: { value: 'Refazer' } })
  expect((aberta.getByRole('button', { name: 'Voltar' }) as HTMLButtonElement).disabled).toBe(false)
  expect(falso.chamadas).toEqual([])
})

test('voltar sem responsável na etapa marca quem está na tela; sem ele na lista, ninguém', async () => {
  montar([CAMINHO_COM_REVISAO_CONCLUIDA[0], CAMINHO_COM_REVISAO_CONCLUIDA[1],
    { ...CAMINHO_COM_REVISAO_CONCLUIDA[2], responsavelId: null, responsavelNome: null }, CAMINHO_COM_REVISAO_CONCLUIDA[3]])
  expect(marcado(await abrirVoltar(REVISAO))).toBe(EU.nome)
})

test('voltar à Revisão interna não oferece o autor da versão mais recente e marca quem está na tela', async () => {
  montar(CAMINHO_COM_REVISAO_CONCLUIDA, { ultimaVersao: VERSAO_DA_BIA })
  const aberta = await abrirVoltar(REVISAO)
  expect(opcoes(aberta)).toEqual([EU.nome, 'Ninguém por enquanto'])
  expect(marcado(aberta)).toBe(EU.nome)
})

test('em outra etapa, voltar oferece o autor da versão mais recente', async () => {
  montar(CAMINHO_COM_REVISAO_CONCLUIDA, { ultimaVersao: VERSAO_DA_BIA })
  expect(opcoes(await abrirVoltar(RELATORIO))).toEqual([EU.nome, BIA.nome, 'Ninguém por enquanto'])
})

test('confirmar grava o motivo e o responsável escolhido, e a etapa volta em andamento com ele', async () => {
  const falso = montar(CAMINHO_COM_REVISAO_CONCLUIDA)
  const aberta = await abrirVoltar(REVISAO)
  fireEvent.click(aberta.getByRole('radio', { name: EU.nome }))
  fireEvent.change(aberta.getByLabelText('Motivo'), { target: { value: 'Refazer' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Voltar' }))
  expect(await linha(REVISAO, 'atual')).toBeTruthy()
  expect(await (await agoraDoVerso()).findByText(EU.nome)).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'voltar', id: 'a6', nota: 'Refazer', usuarioId: EU.id }])
})

test('"Ninguém por enquanto" volta a etapa sem responsável', async () => {
  const falso = montar(CAMINHO_COM_REVISAO_CONCLUIDA)
  const aberta = await abrirVoltar(REVISAO)
  fireEvent.click(aberta.getByRole('radio', { name: 'Ninguém por enquanto' }))
  fireEvent.change(aberta.getByLabelText('Motivo'), { target: { value: 'Refazer' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Voltar' }))
  expect(await linha(REVISAO, 'atual')).toBeTruthy()
  expect(await (await agoraDoVerso()).findByText('Sem responsável')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'voltar', id: 'a6', nota: 'Refazer', usuarioId: null }])
})

test('Cancelar fecha a janela de voltar sem gravar', async () => {
  const falso = montar(CAMINHO_COM_REVISAO_CONCLUIDA)
  fireEvent.click((await abrirVoltar(REVISAO)).getByRole('button', { name: 'Cancelar' }))
  expect(janelasPorCima()).toEqual([])
  expect(falso.chamadas).toEqual([])
  expect(await linha(REVISAO, 'concluída')).toBeTruthy()
})

test.each([
  ['sem conexão', 'A alteração não foi salva: sem conexão.'],
  [new TravaDoBanco(FRASE_DA_BIA), FRASE_DA_BIA],
])('falha ao voltar aparece como alerta, sem mudar a etapa (%s)', async (falha, texto) => {
  const falso = montar(CAMINHO_COM_REVISAO_CONCLUIDA, { falha })
  const aberta = await abrirVoltar(REVISAO)
  fireEvent.change(aberta.getByLabelText('Motivo'), { target: { value: 'Refazer' } })
  fireEvent.click(aberta.getByRole('button', { name: 'Voltar' }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe(texto)
  expect(await linha(REVISAO, 'concluída')).toBeTruthy()
  expect(falso.chamadas).toEqual([])
})
