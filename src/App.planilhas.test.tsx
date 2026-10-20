import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import type { AtualizacaoDasPlanilhas } from './planilhas/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const ADMINISTRADOR = { ...USUARIO_DE_TESTE, nome: 'Ana Administradora', perfil: 'administrador' as Perfil }

function tentativa(parte: Partial<AtualizacaoDasPlanilhas> & { id: string }): AtualizacaoDasPlanilhas {
  return {
    iniciadaEm: '2026-10-20T09:00:00Z', origem: 'automatica', pedidaPor: null, resultado: 'concluida', motivo: null, ...parte,
  }
}

function renderizar(planilhas: PlanilhasFalso, acesso = AcessoFalso.logadoComo(ADMINISTRADOR)) {
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()}
    versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={planilhas} />)
}

async function abrirAbaPlanilhas(planilhas: PlanilhasFalso) {
  renderizar(planilhas)
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(within(navegacao).getByRole('button', { name: 'Administração' }))
  fireEvent.click(await screen.findByRole('tab', { name: 'Planilhas' }))
  await screen.findByRole('heading', { name: 'Planilhas' })
}

const BOTAO = 'Atualizar planilhas agora'

test('a aba Planilhas vem depois de Catálogo de etapas, só para o administrador', async () => {
  renderizar(new PlanilhasFalso())
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(within(navegacao).getByRole('button', { name: 'Administração' }))
  const abas = (await screen.findAllByRole('tab')).map((aba) => aba.textContent)
  expect(abas).toEqual(['Usuários', 'Catálogo de etapas', 'Planilhas'])
})

test.each<[Perfil]>([['integrante_ep'], ['consulta']])('o perfil %s não vê a aba nem a lista', async (perfil) => {
  window.location.hash = '#/administracao'
  renderizar(new PlanilhasFalso(), AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil }))
  await screen.findByText(/não permite administrar usuários/)
  expect(screen.queryByRole('tab', { name: 'Planilhas' })).toBeNull()
})

test('lista as tentativas da mais recente para a mais antiga, com origem, quando, resultado e motivo', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.atualizacoes = [
    tentativa({ id: 't3', iniciadaEm: '2026-10-20T12:00:00Z', resultado: 'sem_resposta' }),
    tentativa({ id: 't2', iniciadaEm: '2026-10-20T11:00:00Z', origem: 'botao', pedidaPor: 'Bruno Teste',
      resultado: 'falhou', motivo: 'planilha_publica_recusada' }),
    tentativa({ id: 't1', iniciadaEm: '2026-10-20T09:00:00Z', resultado: 'falhou', motivo: 'codigo_que_nao_existe' }),
  ]
  await abrirAbaPlanilhas(planilhas)
  const linhas = within(await screen.findByRole('table')).getAllByRole('row').slice(1)
  expect(linhas.map((linha) => linha.textContent)).toEqual([
    '20/10/2026, 09:00AutomáticaSem resposta—',
    '20/10/2026, 08:00Pelo botão · Bruno TesteFalhouO Google recusou a escrita na planilha pública.',
    '20/10/2026, 06:00AutomáticaFalhouA atualização falhou por um motivo não identificado.',
  ])
})

test('antes da primeira tentativa, diz "Nenhuma atualização ainda."', async () => {
  await abrirAbaPlanilhas(new PlanilhasFalso())
  expect(await screen.findByText('Nenhuma atualização ainda.')).toBeTruthy()
})

test('os dois links abrem em aba nova', async () => {
  await abrirAbaPlanilhas(new PlanilhasFalso())
  for (const nome of ['Planilha interna', 'Planilha pública']) {
    const link = await screen.findByRole('link', { name: new RegExp(nome) })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  }
})

test('sem configuração, a aba diz isso no lugar dos links e o botão explica por que não atualiza', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.links = null
  await abrirAbaPlanilhas(planilhas)
  expect(await screen.findByText('As planilhas ainda não foram configuradas neste ambiente.')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Planilha/ })).toBeNull()
  const botao = screen.getByRole('button', { name: BOTAO }) as HTMLButtonElement
  expect(botao.disabled).toBe(true)
  expect(botao.getAttribute('aria-describedby')).toBeTruthy()
  expect(screen.getByText(/O botão fica desligado: as planilhas ainda não foram configuradas/)).toBeTruthy()
})

test('apertar o botão mostra a tentativa em andamento na hora e desliga o botão; ela muda sozinha e libera o botão', async () => {
  const planilhas = new PlanilhasFalso('Ana Administradora')
  await abrirAbaPlanilhas(planilhas)
  fireEvent.click(await screen.findByRole('button', { name: BOTAO }))
  expect(await screen.findByText('Pelo botão · Ana Administradora')).toBeTruthy()
  expect(screen.getByText('Em andamento')).toBeTruthy()
  expect((screen.getByRole('button', { name: BOTAO }) as HTMLButtonElement).disabled).toBe(true)

  planilhas.terminar('t1', 'concluida')
  await act(() => vi.advanceTimersByTimeAsync(5000))
  expect(await screen.findByText('Concluída')).toBeTruthy()
  expect((screen.getByRole('button', { name: BOTAO }) as HTMLButtonElement).disabled).toBe(false)
})

test('sem tentativa em andamento, a aba não relê sozinha', async () => {
  const planilhas = new PlanilhasFalso()
  const ler = vi.spyOn(planilhas, 'listarAtualizacoes')
  await abrirAbaPlanilhas(planilhas)
  await screen.findByText('Nenhuma atualização ainda.')
  const leituras = ler.mock.calls.length
  await act(() => vi.advanceTimersByTimeAsync(30000))
  expect(ler.mock.calls.length).toBe(leituras)
})

test('uma tentativa "Sem resposta" deixa o botão ligado', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.atualizacoes = [tentativa({ id: 't1', resultado: 'sem_resposta' })]
  await abrirAbaPlanilhas(planilhas)
  await screen.findByText('Sem resposta')
  expect((screen.getByRole('button', { name: BOTAO }) as HTMLButtonElement).disabled).toBe(false)
})

test('a recusa do banco aparece como "Já há uma atualização em andamento."', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.falharAoPedir = new TravaDoBanco('Já há uma atualização em andamento.')
  await abrirAbaPlanilhas(planilhas)
  fireEvent.click(await screen.findByRole('button', { name: BOTAO }))
  expect((await screen.findByRole('alert')).textContent).toBe('Já há uma atualização em andamento.')
})

test('outra falha ao pedir mostra o motivo e a lista continua na tela', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.atualizacoes = [tentativa({ id: 't1' })]
  planilhas.falharAoPedir = new Error('sem rede')
  await abrirAbaPlanilhas(planilhas)
  fireEvent.click(await screen.findByRole('button', { name: BOTAO }))
  expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível pedir a atualização (sem rede). Tente de novo.')
  expect(screen.getByText('Concluída')).toBeTruthy()
})

test('enquanto lê, mostra "Carregando planilhas…"', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.segurarLeitura = true
  await abrirAbaPlanilhas(planilhas)
  expect(await screen.findByText('Carregando planilhas…')).toBeTruthy()
})

test('se a leitura falha, mostra o erro com "Tentar de novo", que recarrega', async () => {
  const planilhas = new PlanilhasFalso()
  planilhas.falharAoLer = true
  await abrirAbaPlanilhas(planilhas)
  expect(await screen.findByText(/Não foi possível carregar as planilhas/)).toBeTruthy()
  planilhas.falharAoLer = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('Nenhuma atualização ainda.')).toBeTruthy()
})
