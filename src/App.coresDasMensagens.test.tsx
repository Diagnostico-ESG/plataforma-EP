import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import css from './components/administracao/Administracao.css?raw'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'
import { regrasDaClasse } from './testes/regrasDaClasse'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ANA = 'ana.teste@ccivil.pr.gov.br'
const LINHAS: LinhaDeUsuario[] = [
  { chave: 'u-ana', nome: 'Ana Teste', email: ANA, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' },
]

function acessoDoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [...LINHAS]
  return acesso
}

// As classes são o contrato de cor; o CSS (último teste) liga cada uma à sua cor.
function ehVermelha(mensagem: HTMLElement) {
  const caixa = mensagem.closest('.administracao-erro, .administracao-falha')
  expect(caixa).not.toBeNull()
  expect(caixa?.classList.contains('administracao-sem-permissao')).toBe(false)
}

test('erro ao carregar a lista é vermelho', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falharLista = true
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  ehVermelha(await screen.findByText(/Não foi possível carregar os usuários/))
})

test('erro ao carregar o histórico é vermelho', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falharHistorico = true
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  ehVermelha(await screen.findByText(/Não foi possível carregar o histórico/))
})

test('erro de gravação é vermelho', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falhaDeGravacao = 'sem conexão'
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  await screen.findByRole('table', { busy: false })
  fireEvent.change(screen.getByLabelText(`Perfil de ${ANA}`), { target: { value: 'integrante_ep' } })
  fireEvent.click(screen.getByRole('button', { name: `Salvar perfil de ${ANA}` }))
  ehVermelha(await screen.findByText('A alteração não foi salva: sem conexão.'))
})

test('recusa de trava é vermelha', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Você não pode desativar a si mesmo.')
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  await screen.findByRole('table', { busy: false })
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  ehVermelha(await screen.findByText('Você não pode desativar a si mesmo.'))
})

test('perfil sem permissão é aviso amarelo, não falha', async () => {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'consulta' })} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  const aviso = await screen.findByText(/não permite administrar usuários/)
  expect(aviso.classList.contains('administracao-sem-permissao')).toBe(true)
  expect(aviso.closest('.administracao-erro, .administracao-falha')).toBeNull()
})

test('o CSS pinta falha e erro com as cores de atraso e o aviso com as de pendência', () => {
  expect(regrasDaClasse(css, '.administracao-falha')).toContain('--atraso-fundo')
  expect(regrasDaClasse(css, '.administracao-falha')).toContain('--atraso-texto')
  expect(regrasDaClasse(css, '.administracao-erro')).toContain('--atraso-fundo')
  expect(regrasDaClasse(css, '.administracao-erro')).not.toContain('--pendencia')
  expect(regrasDaClasse(css, '.administracao-sem-permissao')).toContain('--pendencia-fundo')
})
