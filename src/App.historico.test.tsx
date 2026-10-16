import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { EventoDoHistorico, Perfil } from './acesso/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BETO = 'beto.teste@ccivil.pr.gov.br'
const HISTORICO: EventoDoHistorico[] = [
  { id: 2, ocorridoEm: '2026-10-08T14:05:00Z', autor: 'Ana Teste', acao: 'desativar', entidade: 'usuario',
    alvo: 'Beto Teste', antes: { ativo: true }, depois: { ativo: false } },
  { id: 1, ocorridoEm: '2026-10-07T12:00:00Z', autor: null, acao: 'autorizar', entidade: 'autorizacao',
    alvo: 'nova.teste@ccivil.pr.gov.br', antes: null, depois: { email: 'nova.teste@ccivil.pr.gov.br', perfil: 'consulta' } },
]

function acessoDoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [{ chave: 'u-beto', nome: 'Beto Teste', email: BETO, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' }]
  acesso.historico = [...HISTORICO]
  return acesso
}

function secaoDoHistorico() {
  return within(screen.getByRole('region', { name: 'Histórico de usuários' }))
}

test('o histórico lista, na ordem recebida, data e hora, autor, ação, alvo, antes e depois', async () => {
  render(<App acesso={acessoDoAdministrador()} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  const itens = await waitFor(() => secaoDoHistorico().getAllByRole('listitem'))
  expect(itens.map((item) => item.textContent)).toEqual([
    expect.stringMatching(/08\/10\/2026, 11:05.*Ana Teste.*Desativou.*Beto Teste.*Situação: Ativo.*Situação: Inativo/),
    expect.stringMatching(/07\/10\/2026, 09:00.*Configuração inicial \(direto no banco\).*Autorizou o e-mail.*—.*Perfil: Consulta/),
  ])
})

test('histórico vazio mostra "Nenhuma alteração registrada ainda."', async () => {
  const acesso = acessoDoAdministrador()
  acesso.historico = []
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  expect(await screen.findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
})

test('enquanto carrega, mostra "Carregando histórico…"', async () => {
  const acesso = acessoDoAdministrador()
  acesso.segurarHistorico = true
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  expect(await screen.findByText('Carregando histórico…')).toBeTruthy()
})

test('se o histórico falha, mostra o erro e recupera com Tentar de novo', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falharHistorico = true
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  expect(await screen.findByText('Não foi possível carregar o histórico. Verifique a conexão e tente de novo.'))
    .toBeTruthy()
  acesso.falharHistorico = false
  fireEvent.click(secaoDoHistorico().getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText(/Desativou/)).toBeTruthy()
})

test('depois de uma alteração, o histórico é lido de novo', async () => {
  const acesso = acessoDoAdministrador()
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  await screen.findByRole('table', { busy: false })
  await waitFor(() => expect(acesso.chamadas.listarHistorico).toBe(1))
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${BETO}` }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar' }))
  await waitFor(() => expect(acesso.chamadas.listarHistorico).toBe(2))
})

test.each<Perfil>(['integrante_ep', 'consulta'])('perfil %s não vê nem pede o histórico', async (perfil) => {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  await screen.findByText(/não permite administrar usuários/)
  expect(screen.queryByRole('region', { name: 'Histórico de usuários' })).toBeNull()
  expect(acesso.chamadas.listarHistorico).toBe(0)
})
