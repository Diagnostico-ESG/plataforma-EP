import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fixarOHoje } from './testes/reunioesDeTeste'
import { montarNosCadastros } from './testes/reunioesNosCadastros'

beforeEach(() => {
  window.location.hash = '#/setores/s1'
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const secao = async () => within(await screen.findByRole('region', { name: 'Reuniões do setor' }))

async function textosDaSecao(): Promise<string[]> {
  const itens = await (await secao()).findAllByRole('listitem')
  return itens.map((item) => item.textContent ?? '')
}

test('a seção mostra as reuniões do setor, com data, tipo e processos: as próximas primeiro, depois as realizadas', async () => {
  montarNosCadastros()
  expect(await textosDaSecao()).toEqual([
    '20/10/2026 09:30 · Sensibilização',
    '14/10/2026 · Sensibilização',
    '01/10/2026 · Modelagem · Arquivar Pasta, Emitir Ofício',
  ])
})

test('setor sem reunião mostra "Nenhuma reunião."', async () => {
  window.location.hash = '#/setores/s2'
  montarNosCadastros({ ajustarReunioes: (falso) => { falso.reunioes = falso.reunioes.filter((r) => r.setorId !== 's2') } })
  expect(await (await secao()).findByText('Nenhuma reunião.')).toBeTruthy()
})

test('enquanto as reuniões carregam, a seção avisa', async () => {
  montarNosCadastros({ ajustarReunioes: (falso) => { falso.segurarLeitura = true } })
  expect((await (await secao()).findByRole('status')).textContent).toBe('Carregando reuniões…')
})

test('se a leitura falha, a seção mostra o erro e [Tentar de novo] recarrega', async () => {
  const { reunioes } = montarNosCadastros({ ajustarReunioes: (falso) => { falso.falharLeitura = true } })
  const tela = await secao()
  expect(await tela.findByText('Não foi possível carregar as reuniões. Verifique a conexão e tente de novo.')).toBeTruthy()
  reunioes.falharLeitura = false
  fireEvent.click(tela.getByRole('button', { name: 'Tentar de novo' }))
  expect(await tela.findAllByRole('listitem')).toHaveLength(3)
})

test('clicar numa reunião abre o painel dela na área Reuniões', async () => {
  montarNosCadastros()
  await textosDaSecao()
  fireEvent.click((await secao()).getByRole('button', { name: '01/10/2026' }))
  expect(await screen.findByRole('complementary', { name: 'Painel da reunião' })).toBeTruthy()
  expect(window.location.hash).toBe('#/reunioes/r4')
})

test('[Registrar reunião] abre o formulário com o setor preenchido', async () => {
  montarNosCadastros()
  await textosDaSecao()
  fireEvent.click((await secao()).getByRole('button', { name: 'Registrar reunião' }))
  const formulario = within(await screen.findByRole('form', { name: 'Registrar reunião' }))
  await waitFor(() => expect((formulario.getByLabelText('Setor') as HTMLSelectElement).value).toBe('s1'))
  expect((formulario.getByLabelText('Sensibilização') as HTMLInputElement).checked).toBe(false)
  expect((formulario.getByLabelText('Modelagem') as HTMLInputElement).checked).toBe(false)
  expect(window.location.hash).toBe('#/reunioes/nova?para-setor=s1')
})

test('a Consulta vê a seção sem [Registrar reunião]', async () => {
  montarNosCadastros({ perfil: 'consulta' })
  await textosDaSecao()
  expect((await secao()).queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})

test('setor inativo mostra as reuniões dele, mas sem [Registrar reunião]', async () => {
  window.location.hash = '#/setores/s3'
  montarNosCadastros({
    ajustarReunioes: (falso) => {
      falso.reunioes = [{ ...falso.reunioes[2], id: 'r9', setorId: 's3', setorSigla: 'TSC', setorAtivo: false }]
    },
  })
  expect(await textosDaSecao()).toEqual(['14/10/2026 · Sensibilização'])
  expect((await secao()).queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})
