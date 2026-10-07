import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'

afterEach(cleanup)

const BOTAO_ENTRAR = { name: 'Entrar com a conta institucional' }

test('sem sessão, mostra a tela de entrada e o botão chama o Google', async () => {
  const acesso = new AcessoFalso()
  render(<App acesso={acesso} />)
  fireEvent.click(await screen.findByRole('button', BOTAO_ENTRAR))
  expect(acesso.chamadas.entrarComGoogle).toBe(1)
})

test('enquanto confere o acesso, mostra que está verificando', () => {
  const acesso = new AcessoFalso()
  acesso.segurarVerificacao = true
  render(<App acesso={acesso} />)
  expect(screen.getByRole('status').textContent).toBe('Verificando seu acesso…')
})

test('conta fora do domínio vê a mensagem com o e-mail usado', async () => {
  const acesso = new AcessoFalso()
  acesso.recusa = { motivo: 'fora_do_dominio', email: 'pessoa@gmail.com' }
  render(<App acesso={acesso} />)
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Use sua conta @ccivil.pr.gov.br. A conta pessoa@gmail.com não é institucional.',
  )
})

test('conta sem autorização vê a mensagem para pedir a um administrador', async () => {
  const acesso = new AcessoFalso()
  acesso.recusa = { motivo: 'sem_autorizacao', email: 'nova.pessoa@ccivil.pr.gov.br' }
  render(<App acesso={acesso} />)
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A conta nova.pessoa@ccivil.pr.gov.br ainda não foi autorizada. Peça a um administrador.',
  )
})

test('usuário inativo tem a sessão encerrada e vê o motivo', async () => {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, ativo: false })
  render(<App acesso={acesso} />)
  expect((await screen.findByRole('alert')).textContent).toBe('Seu acesso está inativo. Fale com um administrador.')
  expect(acesso.chamadas.sair).toBe(1)
})

test('falha de conexão mostra a mensagem e Tentar de novo recupera', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falharConexao = true
  render(<App acesso={acesso} />)
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Não foi possível conectar. Verifique a conexão e tente de novo.',
  )
  acesso.falharConexao = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('heading', { name: 'Processos' })).toBeTruthy()
})
