import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoCatalogo, ProcessoLido } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM: EtapaDoCatalogo = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true }
const RELATORIO: EtapaDoCatalogo = {
  id: 'e5', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 5, ativa: true,
}

function processo(nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id: `p-${nome.toLowerCase().replace(/[^a-z]/g, '')}`, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: MODELAGEM.codigo, nome: MODELAGEM.nome, ordem: MODELAGEM.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [],
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
    dataDaReuniao: null, etapasDoSetor: [], etapasDoProcesso: [], ...mudancas,
  }
}

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = [], ajustar }: Montagem = {}) {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = [RELATORIO, MODELAGEM]
  falso.processos = processos
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}

const coluna = (nome: string) => within(screen.getByRole('region', { name: nome }))
const cartoesDa = (nome: string) => coluna(nome).queryAllByRole('link').map((cartao) => cartao.textContent)

test('carregando: o aviso e as colunas-fantasma', async () => {
  montar({ ajustar: (falso) => { falso.segurarListaDeProcessos = true } })
  expect((await screen.findByText('Carregando processos…')).getAttribute('role')).toBe('status')
  expect(document.querySelectorAll('.coluna-fantasma').length).toBeGreaterThan(0)
})

test('erro ao carregar: a mensagem e [Tentar de novo], que carrega de novo', async () => {
  const falso = montar({ processos: [processo('Emitir Ofício')], ajustar: (f) => { f.falharListaDeProcessos = true } })
  const alerta = await screen.findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar os processos. Verifique a conexão e tente de novo.')
  falso.falharListaDeProcessos = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('region', { name: MODELAGEM.nome })).toBeTruthy()
})

test('sem processos: o aviso de vazio, com [Cadastrar processo] só para quem pode', async () => {
  montar()
  expect(await screen.findByText('Nenhum processo cadastrado ainda.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Cadastrar processo' })).toBeTruthy()
  cleanup()
  montar({ perfil: 'consulta' })
  expect(await screen.findByText('Nenhum processo cadastrado ainda.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})

test('as colunas: uma por etapa ativa, na ordem do catálogo, sem "Aguardando o setor"', async () => {
  montar({ processos: [processo('Emitir Ofício')] })
  await screen.findByRole('region', { name: MODELAGEM.nome })
  const titulos = screen.getAllByRole('region').map((regiao) => regiao.getAttribute('aria-label'))
  expect(titulos.filter((titulo) => titulo === MODELAGEM.nome || titulo === RELATORIO.nome)).toEqual([MODELAGEM.nome, RELATORIO.nome])
  expect(screen.queryByRole('region', { name: 'Aguardando o setor' })).toBeNull()
})

test('cada processo fica na coluna da etapa atual, em ordem de nome', async () => {
  montar({ processos: [
    processo('Zeta'), processo('Alfa'),
    processo('Gama', { etapaAtual: { codigo: RELATORIO.codigo, nome: RELATORIO.nome, ordem: 5 } }),
  ] })
  await screen.findByRole('region', { name: MODELAGEM.nome })
  expect(cartoesDa(MODELAGEM.nome).map((texto) => texto?.includes('Alfa'))).toEqual([true, false])
  expect(cartoesDa(RELATORIO.nome)).toHaveLength(1)
})

test('o cartão traz sigla, nome, macroprocesso, a pílula "A classificar" e o responsável', async () => {
  montar({ processos: [
    processo('Emitir Ofício', { tipo: 'a_classificar', responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null } }),
    processo('Pagar Diária', { tipo: 'processo' }),
  ] })
  await screen.findByRole('region', { name: MODELAGEM.nome })
  const cartao = within(screen.getByRole('link', { name: /Emitir Ofício/ }))
  expect(cartao.getByText('TSA')).toBeTruthy()
  expect(cartao.getByText('Macro de Teste')).toBeTruthy()
  expect(cartao.getByText('A classificar')).toBeTruthy()
  expect(cartao.getByRole('img', { name: 'Ana Teste' })).toBeTruthy()
  expect(within(screen.getByRole('link', { name: /Pagar Diária/ })).queryByText('A classificar')).toBeNull()
})

test('suspenso aparece com a pílula "Suspenso"; concluído e cancelado saem do Quadro', async () => {
  montar({ processos: [
    processo('Parado', { situacao: 'suspenso' }),
    processo('Pronto', { situacao: 'concluido', etapaAtual: null }),
    processo('Desistido', { situacao: 'cancelado' }),
  ] })
  await screen.findByRole('region', { name: MODELAGEM.nome })
  expect(within(screen.getByRole('link', { name: /Parado/ })).getByText('Suspenso')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Pronto/ })).toBeNull()
  expect(screen.queryByRole('link', { name: /Desistido/ })).toBeNull()
})

test('clicar no cartão abre o painel pelo endereço; [Cadastrar processo] leva ao cadastro', async () => {
  montar({ processos: [processo('Emitir Ofício')] })
  fireEvent.click(await screen.findByRole('link', { name: /Emitir Ofício/ }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p-emitirofcio'))
  window.location.hash = '#/processos'
  fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar processo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/novo'))
})

test('o item Quadro da faixa lateral leva a #/processos', async () => {
  window.location.hash = '#/setores'
  montar()
  fireEvent.click(await screen.findByRole('button', { name: 'Quadro' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(await screen.findByText('Nenhum processo cadastrado ainda.')).toBeTruthy()
})

test('a Consulta vê o Quadro sem botões de alteração', async () => {
  montar({ perfil: 'consulta', processos: [processo('Emitir Ofício')] })
  await screen.findByRole('link', { name: /Emitir Ofício/ })
  expect(screen.queryByRole('button', { name: 'Cadastrar processo' })).toBeNull()
})
