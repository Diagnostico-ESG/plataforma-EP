import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ADMINISTRADOR = { ...USUARIO_DE_TESTE, nome: 'Ana Administradora', perfil: 'administrador' as Perfil }
const LINHAS: LinhaDeUsuario[] = [
  { chave: 'nova.teste@ccivil.pr.gov.br', nome: null, email: 'nova.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'consulta', situacao: 'aguardando' },
  { chave: 'u1', nome: 'Carla Teste', email: 'carla.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'administrador', situacao: 'ativo' },
  { chave: 'u2', nome: 'Bruno Teste', email: 'bruno.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'integrante_ep', situacao: 'inativo' },
]

function acessoDoAdministrador() {
  const acesso = AcessoFalso.logadoComo(ADMINISTRADOR)
  acesso.linhas = [...LINHAS]
  return acesso
}

async function irParaAdministracao(acesso: AcessoFalso) {
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} />)
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(within(navegacao).getByRole('button', { name: 'Administração' }))
}

test('o administrador vê Administração na navegação e chega à lista de usuários', async () => {
  await irParaAdministracao(acessoDoAdministrador())
  expect(await screen.findByRole('heading', { name: 'Usuários' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Administração' }).getAttribute('aria-current')).toBe('page')
})

test.each<[Perfil, string]>([['integrante_ep', 'Integrante do EP'], ['consulta', 'Consulta']])(
  'perfil %s que chega pelo endereço vê a mensagem, sem a lista', async (perfil, rotulo) => {
    window.location.hash = '#/administracao'
    render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} />)
    expect(await screen.findByText(
      `Seu perfil (${rotulo}) não permite administrar usuários. Peça a um administrador para mudar seu perfil.`)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

test('enquanto carrega, mostra "Carregando usuários…" com linhas-fantasma', async () => {
  const acesso = acessoDoAdministrador()
  acesso.segurarLista = true
  await irParaAdministracao(acesso)
  expect(await screen.findByText('Carregando usuários…')).toBeTruthy()
  expect(document.querySelectorAll('.linha-fantasma').length).toBeGreaterThan(0)
})

test('a tabela mostra nome, e-mail, perfil e situação em pílula com texto', async () => {
  await irParaAdministracao(acessoDoAdministrador())
  const tabela = await screen.findByRole('table', { busy: false })
  const linhas = within(tabela).getAllByRole('row').slice(1).map((linha) => linha.textContent)
  expect(linhas[0]).toContain('nova.teste@ccivil.pr.gov.br')
  expect(linhas[0]).toContain('Aguardando primeiro acesso')
  expect(linhas[1]).toContain('Carla Teste')
  expect(linhas[1]).toContain('Administrador')
  expect(linhas[1]).toContain('Ativo')
  expect(linhas[2]).toContain('Inativo')
  expect(within(tabela).getByRole('img', { name: 'Bruno Teste' }).textContent).toBe('BT')
})

test('se a lista falha, mostra o erro e recupera com Tentar de novo', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falharLista = true
  await irParaAdministracao(acesso)
  expect(await screen.findByText('Não foi possível carregar os usuários. Verifique a conexão e tente de novo.')).toBeTruthy()
  acesso.falharLista = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('table', { busy: false })).toBeTruthy()
})
