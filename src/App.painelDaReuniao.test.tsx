import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fixarOHoje, linhasDasReunioes, montarReunioes, reuniao, REUNIOES_DE_TESTE } from './testes/reunioesDeTeste'

beforeEach(() => {
  window.location.hash = '#/reunioes'
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const painel = () => within(screen.getByRole('complementary', { name: 'Painel da reunião' }))

async function abrirAReuniao(botao: string, montagem: Parameters<typeof montarReunioes>[0] = {}) {
  const falso = montarReunioes(montagem)
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: botao }))
  await screen.findByRole('complementary', { name: 'Painel da reunião' })
  return falso
}

test('clicar numa linha abre o painel com todos os dados e o id da reunião no endereço', async () => {
  await abrirAReuniao('01/10/2026')
  expect(window.location.hash).toBe('#/reunioes/r4')
  await painel().findByText('Reunião de modelagem')
  const dados = painel().getByRole('region', { name: 'Dados da reunião' })
  const texto = dados.textContent ?? ''
  for (const esperado of ['Modelagem', 'TSA', '01/10/2026', 'Link da chamada', 'Arquivar Pasta', 'Emitir Ofício',
    'Ficou combinado revisar o fluxo.', 'Prazo na sexta.']) expect(texto).toContain(esperado)
})

test('os dados que faltam aparecem como traço, e a sensibilização não mostra processos', async () => {
  await abrirAReuniao('14/10/2026')
  const dados = painel().getByRole('region', { name: 'Dados da reunião' })
  expect(within(dados).queryByText('Processos')).toBeNull()
  expect(within(dados).getByText('Local').nextElementSibling?.textContent).toBe('—')
  expect(within(dados).getByText('Anotações').nextElementSibling?.textContent).toBe('—')
})

test('o processo cancelado e o setor inativo aparecem marcados com pílula', async () => {
  const reunioes = [
    ...REUNIOES_DE_TESTE.filter((r) => r.id === 'r4').map((r) => ({ ...r, setorAtivo: false })),
  ]
  await abrirAReuniao('01/10/2026', { reunioes })
  const dados = painel().getByRole('region', { name: 'Dados da reunião' })
  expect(within(dados).getByText('Inativo')).toBeTruthy()
  expect(within(dados).getByText('Cancelado')).toBeTruthy()
  expect(within(dados).getAllByText(/Inativo|Cancelado/)).toHaveLength(2)
})

test('clicar num processo tratado abre o painel dele', async () => {
  await abrirAReuniao('01/10/2026')
  const ligacao = painel().getByRole('link', { name: 'Emitir Ofício' })
  expect(ligacao.getAttribute('href')).toBe('#/processos/p1')
  fireEvent.click(ligacao)
  expect(await screen.findByRole('complementary', { name: 'Painel do processo' })).toBeTruthy()
  expect(window.location.hash).toBe('#/processos/p1')
})

test('o botão Fechar e o Esc fecham o painel e devolvem o foco à linha', async () => {
  await abrirAReuniao('01/10/2026')
  fireEvent.click(painel().getByRole('button', { name: 'Fechar o painel' }))
  await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Painel da reunião' })).toBeNull())
  expect(window.location.hash).toBe('#/reunioes')
  await waitFor(() => expect(document.activeElement?.id).toBe('linha-reuniao-r4'))
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  fireEvent.keyDown(await screen.findByRole('complementary', { name: 'Painel da reunião' }), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Painel da reunião' })).toBeNull())
})

test('a Consulta vê o painel sem nenhum botão de alteração', async () => {
  await abrirAReuniao('01/10/2026', { perfil: 'consulta' })
  expect(painel().getAllByRole('button').map((botao) => botao.getAttribute('aria-label'))).toEqual(['Fechar o painel'])
})

test('reunião que não existe mais: o painel avisa e Voltar fecha', async () => {
  window.location.hash = '#/reunioes/sumiu'
  montarReunioes()
  expect(await screen.findByText('Esta reunião não existe mais. Ela pode ter sido excluída.')).toBeTruthy()
  fireEvent.click(painel().getByRole('button', { name: 'Voltar' }))
  await waitFor(() => expect(window.location.hash).toBe('#/reunioes'))
})

test('enquanto lê a reunião mostra o aviso; se a leitura falha, o erro tem Tentar de novo', async () => {
  montarReunioes({ ajustar: (f) => { f.segurarLeituraDaReuniao = true } })
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  expect(await screen.findByText('Carregando reunião…')).toBeTruthy()
  cleanup()
  const outro = montarReunioes({ ajustar: (f) => { f.falharLeituraDaReuniao = true } })
  await linhasDasReunioes()
  fireEvent.click(screen.getByRole('button', { name: '01/10/2026' }))
  expect(await screen.findByText('Não foi possível carregar a reunião. Verifique a conexão e tente de novo.')).toBeTruthy()
  outro.falharLeituraDaReuniao = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await painel().findByText('Reunião de modelagem')).toBeTruthy()
})

test('a lista continua atrás do painel, esmaecida', async () => {
  await abrirAReuniao('20/10/2026 09:30', { reunioes: [reuniao('r1', '2026-10-20', { hora: '09:30' })] })
  expect(document.querySelector('.quadro-esmaecido')).toBeTruthy()
})
