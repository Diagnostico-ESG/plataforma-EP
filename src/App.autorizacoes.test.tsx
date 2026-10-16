import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const AGUARDANDO = 'nova.teste@ccivil.pr.gov.br'

async function abrirComo() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [{ chave: AGUARDANDO, nome: null, email: AGUARDANDO, fotoUrl: null, perfil: 'consulta', situacao: 'aguardando' }]
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  await screen.findByRole('table', { busy: false })
  return acesso
}

function formulario() {
  return within(screen.getByRole('form', { name: 'Autorizar e-mail' }))
}

test('autorizar um e-mail o põe na lista como aguardando e limpa o formulário', async () => {
  const acesso = await abrirComo()
  expect((formulario().getByLabelText('Perfil') as HTMLSelectElement).value).toBe('consulta')
  fireEvent.change(formulario().getByLabelText('E-mail'), { target: { value: ' Pessoa.Teste@CCivil.pr.gov.br ' } })
  fireEvent.change(formulario().getByLabelText('Perfil'), { target: { value: 'integrante_ep' } })
  fireEvent.click(formulario().getByRole('button', { name: 'Autorizar' }))
  expect(await screen.findByText('pessoa.teste@ccivil.pr.gov.br')).toBeTruthy()
  expect(acesso.linhas[0]).toMatchObject({ email: 'pessoa.teste@ccivil.pr.gov.br', perfil: 'integrante_ep' })
  expect((formulario().getByLabelText('E-mail') as HTMLInputElement).value).toBe('')
})

test('e-mail fora do formato é recusado na tela, sem chamar o banco', async () => {
  const acesso = await abrirComo()
  fireEvent.change(formulario().getByLabelText('E-mail'), { target: { value: 'pessoa@gmail.com' } })
  fireEvent.click(formulario().getByRole('button', { name: 'Autorizar' }))
  expect(await formulario().findByText(
    'O e-mail "pessoa@gmail.com" não está no formato esperado: nome@ccivil.pr.gov.br.')).toBeTruthy()
  expect(acesso.linhas).toHaveLength(1)
})

test('falha ao autorizar mostra o motivo e mantém o que foi digitado', async () => {
  const acesso = await abrirComo()
  acesso.falhaDeGravacao = `o e-mail ${AGUARDANDO} já está autorizado`
  fireEvent.change(formulario().getByLabelText('E-mail'), { target: { value: AGUARDANDO } })
  fireEvent.change(formulario().getByLabelText('Perfil'), { target: { value: 'administrador' } })
  fireEvent.click(formulario().getByRole('button', { name: 'Autorizar' }))
  expect(await formulario().findByText(
    `A alteração não foi salva: o e-mail ${AGUARDANDO} já está autorizado. Seus dados continuam no formulário.`)).toBeTruthy()
  expect((formulario().getByLabelText('E-mail') as HTMLInputElement).value).toBe(AGUARDANDO)
  expect((formulario().getByLabelText('Perfil') as HTMLSelectElement).value).toBe('administrador')
})

test('muda o perfil de uma autorização aguardando', async () => {
  const acesso = await abrirComo()
  fireEvent.change(screen.getByLabelText(`Perfil de ${AGUARDANDO}`), { target: { value: 'integrante_ep' } })
  fireEvent.click(screen.getByRole('button', { name: `Salvar perfil de ${AGUARDANDO}` }))
  await waitFor(() => expect(acesso.linhas[0].perfil).toBe('integrante_ep'))
  await screen.findByDisplayValue('Integrante do EP')
})

test('falha ao mudar o perfil mostra o motivo, mantém a escolha e não grava', async () => {
  const acesso = await abrirComo()
  acesso.falhaDeGravacao = 'seu perfil não permite esta alteração'
  fireEvent.change(screen.getByLabelText(`Perfil de ${AGUARDANDO}`), { target: { value: 'administrador' } })
  fireEvent.click(screen.getByRole('button', { name: `Salvar perfil de ${AGUARDANDO}` }))
  expect(await screen.findByText('A alteração não foi salva: seu perfil não permite esta alteração.')).toBeTruthy()
  expect((screen.getByLabelText(`Perfil de ${AGUARDANDO}`) as HTMLSelectElement).value).toBe('administrador')
  expect(acesso.linhas[0].perfil).toBe('consulta')
})

test('exclui uma autorização aguardando', async () => {
  const acesso = await abrirComo()
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir autorização' }))
  await waitFor(() => expect(screen.queryByText(AGUARDANDO)).toBeNull())
  expect(acesso.linhas).toHaveLength(0)
})

test('falha ao excluir mostra o motivo e mantém a linha', async () => {
  const acesso = await abrirComo()
  acesso.falhaDeGravacao = `a autorização de ${AGUARDANDO} não foi encontrada (pode já ter sido usada no primeiro acesso)`
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir autorização' }))
  expect(await screen.findByText(`A alteração não foi salva: ${acesso.falhaDeGravacao}.`)).toBeTruthy()
  expect(screen.getByText(AGUARDANDO)).toBeTruthy()
})
