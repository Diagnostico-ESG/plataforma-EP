import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, SituacaoDoProcesso } from './processos/tipos'
import { escolherNoMenuDoProcesso, janelaPorCima, versoAberto } from './testes/versoDoCartao'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.location.hash = ''
})

function etapaDoProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const PROCESSO: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'a_classificar', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
  etapaAtual: { codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5 },
  responsavel: null, origem: 'retomado', contexto: 'Contexto inventado', observacoes: 'Observação inventada',
  processoPaiId: null, processoPai: null, subprocessos: [],
  motivoDaSituacao: null,
  dataDaReuniao: null, ultimaVersao: null,
  etapasDoProcesso: [
    etapaDoProcesso(4, 'modelagem', 'Modelagem piloto', {
      status: 'concluida', iniciadaEm: '2026-10-11', resolvidaEm: '2026-10-12', responsavelNome: 'Ana Teste' }),
    etapaDoProcesso(5, 'relatorio', 'Relatório e modelagem técnica', { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    etapaDoProcesso(6, 'revisao_interna', 'Revisão interna'),
  ],
}

const PAI: ProcessoLido = { ...PROCESSO, id: 'p2', nome: 'Gerir Ofícios', tipo: 'processo' }
const FILHO: ProcessoLido = { ...PROCESSO, id: 'p3', nome: 'Conferir Ofício', tipo: 'subprocesso', processoPaiId: 'p2' }

const EVENTO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao: 'criar', entidade: 'processo', entidadeRef: 'p1',
  antes: null, depois: { nome: 'Emitir Ofício', setor_sigla: 'TSA' },
}

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = [PROCESSO, PAI, FILHO], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = processos
  falso.etapasDoCatalogo = [{ id: 'e5', codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5, ativa: true }]
  falso.historicoDosProcessos = { p1: [EVENTO] }
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}

const verso = () => screen.getByRole('dialog', { name: 'Processo Emitir Ofício' }) as HTMLDialogElement
const nomeDoProcesso = async () => (await versoAberto()).findByRole('heading', { name: 'Emitir Ofício', level: 2 })

// Abrir

test('o verso abre pelo cartão do Quadro, e fechar volta ao Quadro com o foco no cartão', async () => {
  window.location.hash = '#/processos'
  montar()
  fireEvent.click(await screen.findByRole('link', { name: /Emitir Ofício/ }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p1'))
  await nomeDoProcesso()
  fireEvent.click(within(verso()).getByRole('button', { name: 'Fechar a janela' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(screen.queryByRole('dialog')).toBeNull()
  await waitFor(() => expect(document.activeElement?.id).toBe('cartao-p1'))
})

test('o verso abre pela linha da Lista, e Esc volta à Lista com o foco na linha', async () => {
  window.location.hash = '#/processos/lista'
  montar()
  fireEvent.click((await screen.findAllByRole('cell', { name: 'Emitir Ofício' }))[0])
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista/p1'))
  fireEvent.keyDown(await nomeDoProcesso(), { key: 'Escape' })
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  await waitFor(() => expect(document.activeElement?.id).toBe('linha-p1'))
})

test('o verso abre pelo endereço, como janela modal, com o foco no nome e o Quadro inerte atrás', async () => {
  const modal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
  montar()
  const nome = await nomeDoProcesso()
  expect(modal).toHaveBeenCalledTimes(1)
  expect(verso().open).toBe(true)
  await waitFor(() => expect(document.activeElement).toBe(nome))
  expect(screen.getByRole('region', { name: 'Processos', hidden: true }).querySelector('[inert]')).toBeTruthy()
})

test('pai e subprocesso abrem na mesma janela, com o endereço e o nome da janela mudando', async () => {
  window.location.hash = '#/processos/p2'
  const modal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
  montar()
  const pai = await versoAberto()
  const subprocessos = within(await pai.findByRole('region', { name: 'Subprocessos' }))
  fireEvent.click(subprocessos.getByRole('link', { name: 'Conferir Ofício' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p3'))
  expect(await screen.findByRole('dialog', { name: 'Processo Conferir Ofício' })).toBeTruthy()
  expect(modal).toHaveBeenCalledTimes(1)
})

// Cabeçalho

test('cabeçalho: sigla, nome, macroprocesso e tipo em texto; sem pílula em andamento', async () => {
  montar()
  const cabecalho = within((await nomeDoProcesso()).closest('header') as HTMLElement)
  expect(cabecalho.getByText('TSA')).toBeTruthy()
  expect(cabecalho.getByText('Macro de Teste')).toBeTruthy()
  expect(cabecalho.getByText('A classificar')).toBeTruthy()
  expect(cabecalho.queryByText('Em andamento')).toBeNull()
})

test.each<[SituacaoDoProcesso, string]>([['suspenso', 'Suspenso'], ['cancelado', 'Cancelado'], ['concluido', 'Concluído']])(
  'cabeçalho: pílula de %s', async (situacao, texto) => {
    montar({ processos: [{ ...PROCESSO, situacao, motivoDaSituacao: 'Motivo inventado' }] })
    const cabecalho = within((await nomeDoProcesso()).closest('header') as HTMLElement)
    expect(cabecalho.getByText(texto).className).toContain('pilula')
  })

// Menu "⋯"

async function itensDoMenu(): Promise<string[][]> {
  fireEvent.click(await (await versoAberto()).findByRole('button', { name: 'Ações do processo' }))
  return within(screen.getByRole('menu')).getAllByRole('group').map((grupo) => within(grupo).getAllByRole('menuitem').map((item) => item.textContent ?? ''))
}

test('menu "⋯" em andamento: Histórico, Editar e Reclassificar; Suspender e Cancelar; Excluir', async () => {
  montar()
  expect(await itensDoMenu()).toEqual([
    ['Histórico', 'Editar', 'Reclassificar'], ['Suspender', 'Cancelar processo'], ['Excluir']])
})

test('menu "⋯" do suspenso traz Retomar antes de Cancelar, e o do cancelado só Retomar', async () => {
  montar({ processos: [{ ...PROCESSO, situacao: 'suspenso', motivoDaSituacao: 'Motivo inventado' }] })
  expect((await itensDoMenu())[1]).toEqual(['Retomar', 'Cancelar processo'])
  cleanup()
  montar({ processos: [{ ...PROCESSO, situacao: 'cancelado', motivoDaSituacao: 'Motivo inventado' }] })
  expect((await itensDoMenu())[1]).toEqual(['Retomar'])
})

test('a Consulta vê no "⋯" só o Histórico', async () => {
  montar({ perfil: 'consulta' })
  expect(await itensDoMenu()).toEqual([['Histórico']])
})

test('Histórico pelo "⋯" troca o conteúdo da janela, e "← Voltar ao processo" volta', async () => {
  montar()
  await escolherNoMenuDoProcesso('Histórico')
  const aberto = await versoAberto()
  expect(await aberto.findByRole('heading', { name: 'Histórico' })).toBeTruthy()
  expect(await aberto.findByText('Criou')).toBeTruthy()
  expect(aberto.queryByRole('region', { name: 'Caminho de etapas' })).toBeNull()
  fireEvent.click(aberto.getByRole('button', { name: '← Voltar ao processo' }))
  expect(await aberto.findByRole('region', { name: 'Caminho de etapas' })).toBeTruthy()
})

test('Editar pelo "⋯" abre o formulário na janela, e Cancelar volta ao verso', async () => {
  montar()
  await escolherNoMenuDoProcesso('Editar')
  const form = within(await (await versoAberto()).findByRole('form', { name: 'Editar processo' }))
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(await (await versoAberto()).findByRole('region', { name: 'Caminho de etapas' })).toBeTruthy()
})

test('Suspender pelo "⋯" abre a janela do motivo por cima do verso e grava', async () => {
  const falso = montar()
  await escolherNoMenuDoProcesso('Suspender')
  const janela = within(janelaPorCima())
  fireEvent.change(janela.getByLabelText('Motivo'), { target: { value: 'Setor em mudança' } })
  fireEvent.click(janela.getByRole('button', { name: 'Suspender processo' }))
  await waitFor(() => expect(falso.processos.find((p) => p.id === 'p1')?.situacao).toBe('suspenso'))
  expect(verso().open).toBe(true)
})

test('Excluir pelo "⋯" pede confirmação, e confirmar fecha o verso', async () => {
  montar()
  await escolherNoMenuDoProcesso('Excluir')
  fireEvent.click(within(janelaPorCima()).getByRole('button', { name: 'Excluir processo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(screen.queryByRole('dialog', { name: /^Processo/ })).toBeNull()
})

test('a falha de uma ação do "⋯" aparece logo abaixo do cabeçalho', async () => {
  montar({ ajustar: (falso) => { falso.falhaDeGravacao = 'sem conexão' } })
  await escolherNoMenuDoProcesso('Excluir')
  fireEvent.click(within(janelaPorCima()).getByRole('button', { name: 'Excluir processo' }))
  const alerta = await (await versoAberto()).findByRole('alert')
  expect(alerta.textContent).toContain('sem conexão')
  expect(alerta.previousElementSibling?.tagName).toBe('HEADER')
})

// Estados

test('carregando: a janela já aberta, com "Carregando processo…" para o leitor de tela', async () => {
  montar({ ajustar: (falso) => { falso.segurarLeituraDoProcesso = true } })
  const janela = await screen.findByRole('dialog', { name: 'Processo' })
  expect(within(janela).getByRole('status').textContent).toBe('Carregando processo…')
  expect(within(janela).getByRole('button', { name: 'Fechar a janela' })).toBeTruthy()
})

test('erro ao carregar: a mensagem e [Tentar de novo], que carrega de novo', async () => {
  const falso = montar({ ajustar: (f) => { f.falharLeituraDoProcesso = true } })
  const alerta = await (await versoAberto()).findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar o processo. Verifique a conexão e tente de novo.')
  falso.falharLeituraDoProcesso = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await nomeDoProcesso()).toBeTruthy()
})

test('processo que não existe mais: o aviso e [Voltar], que volta ao Quadro', async () => {
  window.location.hash = '#/processos/p9'
  montar()
  const alerta = await (await versoAberto()).findByRole('alert')
  expect(alerta.textContent).toContain('Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico.')
  fireEvent.click(within(alerta).getByRole('button', { name: 'Voltar' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
})

// O que continua do painel

test('as duas colunas: etapas e versões no trabalho; reunião, dados e estrutura no contexto', async () => {
  window.location.hash = '#/processos/p2'
  montar()
  const aberto = await versoAberto()
  const caminho = await aberto.findByRole('region', { name: 'Caminho de etapas' })
  expect(caminho.closest('.verso-trabalho')).toBeTruthy()
  expect(aberto.getByRole('region', { name: 'Dados do processo' }).closest('.verso-contexto')).toBeTruthy()
  expect(aberto.getByRole('region', { name: 'Subprocessos' }).closest('.verso-contexto')).toBeTruthy()
})

test('os dados do processo aparecem no verso', async () => {
  montar()
  await nomeDoProcesso()
  const aberto = await versoAberto()
  for (const texto of ['Retomado', 'Contexto inventado', 'Observação inventada']) expect(aberto.getByText(texto)).toBeTruthy()
})

test('o caminho começa na Modelagem piloto, com a atual destacada e com as ações', async () => {
  montar()
  const caminho = within(await (await versoAberto()).findByRole('region', { name: 'Caminho de etapas' }))
  const nomes = caminho.getAllByRole('listitem').map((item) => item.querySelector('.etapa-nome')?.textContent)
  expect(nomes).toEqual(['Modelagem piloto', 'Relatório e modelagem técnica', 'Revisão interna'])
  const atuais = caminho.getAllByRole('listitem').filter((item) => item.getAttribute('aria-current') === 'step')
  expect(atuais.map((item) => item.querySelector('.etapa-nome')?.textContent)).toEqual(['Relatório e modelagem técnica'])
  expect(caminho.getAllByRole('button').map((botao) => botao.textContent)).toEqual([
    'Corrigir datas', 'Voltar a esta etapa', 'Assumir', 'Corrigir datas', 'Concluir', 'Realizada anteriormente', 'Assumir'])
})

test('o caminho mostra status, responsável, datas e nota das etapas do processo', async () => {
  montar({ perfil: 'consulta' })
  const caminho = within(await (await versoAberto()).findByRole('region', { name: 'Caminho de etapas' }))
  const modelagem = within((await caminho.findByText('Modelagem piloto')).closest('li') as HTMLElement)
  expect(modelagem.getByText('Concluída')).toBeTruthy()
  expect(modelagem.getByText('Responsável: Ana Teste')).toBeTruthy()
  expect(modelagem.getByText('Início: 11/10/2026 · Conclusão: 12/10/2026')).toBeTruthy()
  const revisao = within((await caminho.findByText('Revisão interna')).closest('li') as HTMLElement)
  expect(revisao.getByText('Responsável: —')).toBeTruthy()
})

test('o Histórico: carregando, erro com [Tentar de novo] e vazio', async () => {
  montar({ ajustar: (f) => { f.segurarHistoricoDoProcesso = true } })
  await escolherNoMenuDoProcesso('Histórico')
  expect(await (await versoAberto()).findByText('Carregando histórico…')).toBeTruthy()
  cleanup()
  montar({ ajustar: (f) => { f.falharHistoricoDoProcesso = true } })
  await escolherNoMenuDoProcesso('Histórico')
  expect((await (await versoAberto()).findByRole('alert')).textContent)
    .toContain('Não foi possível carregar o histórico. Verifique a conexão e tente de novo.')
  cleanup()
  montar({ ajustar: (f) => { f.historicoDosProcessos = {} } })
  await escolherNoMenuDoProcesso('Histórico')
  expect(await (await versoAberto()).findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
})

// Novo processo

test('[Cadastrar processo] abre o Novo processo na janela estreita, e Esc fecha', async () => {
  window.location.hash = '#/processos'
  montar()
  fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar processo' }))
  const janela = await screen.findByRole('dialog', { name: 'Novo processo' })
  expect(janela.classList.contains('verso-estreita')).toBe(true)
  fireEvent.keyDown(await within(janela).findByLabelText('Nome'), { key: 'Escape' })
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(screen.queryByRole('dialog')).toBeNull()
})
