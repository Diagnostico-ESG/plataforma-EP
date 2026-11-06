import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { AcessoFalso } from './acesso/AcessoFalso'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

afterEach(cleanup)

// Capa da tela de entrada (.scratch/capa-de-entrada/spec.md): textos na coluna do login, ilustração só decorativa.
function abrirEntrada(): void {
  render(<App acesso={new AcessoFalso()} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
}

test('a capa mostra o órgão, o título e a frase da plataforma acima do botão', async () => {
  abrirEntrada()
  const botao = await screen.findByRole('button', { name: 'Entrar com a conta institucional' })
  const titulo = screen.getByRole('heading', { level: 1 })
  expect(titulo.textContent).toBe('Escritório de Processos')
  const orgao = screen.getByText('Centro Estadual de Desburocratização (CED)')
  const frase = screen.getByText('Gestão das tarefas e dos documentos do mapeamento de processos da Casa Civil do Paraná.')
  const emOrdem = [orgao, titulo, frase, botao].every((atual, i, todos) =>
    i === 0 || Boolean(todos[i - 1].compareDocumentPosition(atual) & Node.DOCUMENT_POSITION_FOLLOWING))
  expect(emOrdem, 'esperado: órgão, título, frase e botão, nesta ordem').toBe(true)
})

test('a ilustração do Quadro tem as 8 etapas, fica fora do leitor de tela e não tem texto nem foco', async () => {
  abrirEntrada()
  await screen.findByRole('button', { name: 'Entrar com a conta institucional' })
  const ilustracao = document.querySelector('.capa-ilustracao')
  expect(ilustracao, 'esperado um elemento .capa-ilustracao na tela de entrada').not.toBeNull()
  expect(ilustracao?.getAttribute('aria-hidden')).toBe('true')
  expect(ilustracao?.querySelectorAll('.capa-coluna')).toHaveLength(8)
  expect(ilustracao?.textContent?.trim(), 'a ilustração não leva texto').toBe('')
  expect(ilustracao?.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(0)
})
