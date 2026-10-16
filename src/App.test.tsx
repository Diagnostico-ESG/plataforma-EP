import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { AcessoFalso } from './acesso/AcessoFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

afterEach(cleanup)

async function abrirLogado() {
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  await screen.findByRole('heading', { name: 'Processos' })
}

test('abre no Quadro de processos, marcado na navegação', async () => {
  await abrirLogado()
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const quadro = within(navegacao).getByRole('button', { name: 'Quadro' })
  expect(quadro.getAttribute('aria-current')).toBe('page')
})

test('para quem não é administrador, a navegação tem cinco áreas, sem Administração', async () => {
  await abrirLogado()
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const rotulos = Array.from(navegacao.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))
  expect(rotulos).toEqual(['Quadro', 'Lista', 'Setores', 'Reuniões', 'Painel'])
})

test('sem processos, mostra o aviso de vazio com a ação de cadastrar', async () => {
  await abrirLogado()
  expect(await screen.findByText(/Nenhum processo cadastrado ainda/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Cadastrar processo' })).toBeTruthy()
})
