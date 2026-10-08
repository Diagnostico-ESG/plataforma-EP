import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

// Quando o botão em uso some (Salvar, Cancelar, o formulário do nome), o foco precisa de um destino;
// sem ele, quem usa teclado ou leitor de tela volta ao topo da página.
// Depois de uma gravação, o foco se move um instante depois de a tela mudar; por isso a conferência espera.
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

async function abrirComoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [...LINHAS]
  render(<App acesso={acesso} />)
  await screen.findByRole('table', { busy: false })
  return acesso
}

function escolherIntegrante() {
  fireEvent.change(screen.getByLabelText(`Perfil de ${ANA}`), { target: { value: 'integrante_ep' } })
}

test('cancelar a troca de perfil devolve o foco ao seletor', async () => {
  await abrirComoAdministrador()
  escolherIntegrante()
  fireEvent.click(screen.getByRole('button', { name: `Cancelar perfil de ${ANA}` }))
  expect(document.activeElement).toBe(screen.getByLabelText(`Perfil de ${ANA}`))
})

test('salvar o perfil devolve o foco ao seletor', async () => {
  await abrirComoAdministrador()
  escolherIntegrante()
  fireEvent.click(screen.getByRole('button', { name: `Salvar perfil de ${ANA}` }))
  await waitFor(() => expect(screen.queryByRole('button', { name: `Salvar perfil de ${ANA}` })).toBeNull())
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText(`Perfil de ${ANA}`)))
})

test('cancelar a correção do nome devolve o foco ao botão Corrigir nome', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(document.activeElement).toBe(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
})

test('salvar o nome devolve o foco ao botão Corrigir nome', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: 'Ana Corrigida' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByText('Ana Corrigida')
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` })))
})

test('o aviso do e-mail fica ligado ao campo, para o leitor de tela ler os dois juntos', async () => {
  await abrirComoAdministrador()
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'sem-arroba' } })
  fireEvent.click(screen.getByRole('button', { name: 'Autorizar' }))
  const aviso = await screen.findByRole('alert')
  expect(screen.getByLabelText('E-mail').getAttribute('aria-describedby')).toBe(aviso.id)
})
