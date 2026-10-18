import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { AcessoFalso } from './acesso/AcessoFalso'
import css from './components/moldura/Moldura.css?raw'
import { regrasDaClasse } from './testes/regrasDaClasse'
import { VersoesFalso } from './versoes/VersoesFalso'

afterEach(cleanup)

async function abrirLogado(acesso = AcessoFalso.logadoComo()) {
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} versoes={new VersoesFalso()} />)
  return screen.findByRole('button', { name: 'Sua conta: Pessoa de Teste' })
}

test('o avatar com as iniciais ocupa o lugar do ícone de conta', async () => {
  const botaoDaConta = await abrirLogado()
  expect(within(botaoDaConta).getByRole('img', { name: 'Pessoa de Teste' }).textContent).toBe('PT')
  expect(screen.queryByRole('button', { name: 'Sua conta' })).toBeNull()
})

test('o menu da conta mostra nome, perfil e Sair, e fecha com Escape', async () => {
  fireEvent.click(await abrirLogado())
  expect(screen.getByText('Pessoa de Teste')).toBeTruthy()
  expect(screen.getByText('Integrante do EP')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('button', { name: 'Sair' }), { key: 'Escape' })
  expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull()
})

test('fechar o menu com Escape devolve o foco ao avatar', async () => {
  const botaoDaConta = await abrirLogado()
  fireEvent.click(botaoDaConta)
  const sair = screen.getByRole('button', { name: 'Sair' })
  sair.focus()
  fireEvent.keyDown(sair, { key: 'Escape' })
  expect(document.activeElement).toBe(botaoDaConta)
})

test('Sair encerra a sessão e volta à tela de entrada', async () => {
  const acesso = AcessoFalso.logadoComo()
  fireEvent.click(await abrirLogado(acesso))
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('button', { name: 'Entrar com a conta institucional' })).toBeTruthy()
  expect(acesso.chamadas.sair).toBe(1)
})

const FALHA_AO_SAIR = 'Não foi possível sair. Verifique a conexão e tente de novo.'
const ENTRAR = { name: 'Entrar com a conta institucional' }

async function clicarSair(acesso: AcessoFalso) {
  fireEvent.click(await abrirLogado(acesso))
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
}

// Sem rede, o signOut do supabase-js apaga o login do navegador e só depois devolve o erro.
test('Sair com falha depois de o navegador esquecer o login volta à tela de entrada', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falhaAoSair = 'apaga'
  await clicarSair(acesso)
  expect(await screen.findByRole('button', ENTRAR)).toBeTruthy()
  expect(screen.queryByText(FALHA_AO_SAIR)).toBeNull()
})

test('Sair com falha e o login ainda guardado mantém a pessoa dentro e mostra a falha em vermelho', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falhaAoSair = 'mantem'
  await clicarSair(acesso)
  const falha = await screen.findByRole('alert')
  expect(falha.textContent).toBe(FALHA_AO_SAIR)
  expect(falha.className).toContain('menu-conta-falha')
  expect(screen.queryByRole('button', ENTRAR)).toBeNull()
})

test('Sair com falha sem conseguir nem reler o login mantém a pessoa dentro com a mensagem', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falhaAoSair = 'mantem'
  fireEvent.click(await abrirLogado(acesso))
  acesso.falharConexao = true
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect((await screen.findByRole('alert')).textContent).toBe(FALHA_AO_SAIR)
  expect(screen.queryByRole('button', ENTRAR)).toBeNull()
})

test('um novo Sair tira a mensagem, mostra de novo se falhar outra vez e encerra quando dá certo', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falhaAoSair = 'mantem'
  await clicarSair(acesso)
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(screen.queryByRole('alert')).toBeNull()
  expect((await screen.findByRole('alert')).textContent).toBe(FALHA_AO_SAIR)
  acesso.falhaAoSair = null
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('button', ENTRAR)).toBeTruthy()
  expect(acesso.chamadas.sair).toBe(3)
})

test('o botão Sair fica desativado enquanto a saída está em andamento', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.segurarSair = true
  await clicarSair(acesso)
  const sair = screen.getByRole('button', { name: 'Sair' }) as HTMLButtonElement
  expect(sair.disabled).toBe(true)
  fireEvent.click(sair)
  expect(acesso.chamadas.sair).toBe(1)
})

test('o CSS pinta a falha do Sair com as cores de atraso (vermelho)', () => {
  expect(regrasDaClasse(css, '.menu-conta-falha')).toContain('--atraso-fundo')
  expect(regrasDaClasse(css, '.menu-conta-falha')).toContain('--atraso-texto')
})

test('fechar e reabrir o menu depois de uma falha não mostra a mensagem antiga', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falhaAoSair = 'mantem'
  await clicarSair(acesso)
  await screen.findByRole('alert')
  const botaoDaConta = screen.getByRole('button', { name: 'Sua conta: Pessoa de Teste' })
  fireEvent.click(botaoDaConta)
  fireEvent.click(botaoDaConta)
  expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

// O botão fica desativado durante a tentativa e perde o foco; sem devolvê-lo, o teclado volta ao topo.
test('depois de uma falha ao sair, o foco volta ao botão Sair', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falhaAoSair = 'mantem'
  await clicarSair(acesso)
  await screen.findByRole('alert')
  // O foco se move num efeito, um instante depois de a mensagem aparecer; sob carga, conferir na hora falha.
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sair' })))
})

test('clicar fora do menu da conta fecha o menu', async () => {
  fireEvent.click(await abrirLogado())
  fireEvent.pointerDown(document.body)
  expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull()
})

test('clicar dentro do menu da conta não fecha o menu', async () => {
  fireEvent.click(await abrirLogado())
  fireEvent.pointerDown(screen.getByText('Integrante do EP'))
  expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
})

test('a barra superior não tem botão "Filtrar": os filtros ficam na barra própria dos processos', async () => {
  await abrirLogado()
  expect(screen.queryByRole('button', { name: 'Filtrar' })).toBeNull()
})
