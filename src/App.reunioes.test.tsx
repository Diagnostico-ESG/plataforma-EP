import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fixarOHoje, linhasDasReunioes, montarReunioes, reuniao } from './testes/reunioesDeTeste'

beforeEach(() => {
  window.location.hash = '#/reunioes'
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const faixa = () => within(screen.getByRole('navigation', { name: 'Áreas do sistema' }))
const filtros = () => within(screen.getByRole('group', { name: 'Filtros das reuniões' }))

test('o botão Reuniões da faixa lateral abre a área, com as colunas da tabela', async () => {
  window.location.hash = '#/processos'
  montarReunioes()
  await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(faixa().getByRole('button', { name: 'Reuniões' }))
  const [cabecalho] = await linhasDasReunioes()
  expect(cabecalho).toEqual(['Data e hora', 'Tipo', 'Setor', 'Processos', 'Local'])
  expect(window.location.hash).toBe('#/reunioes')
  expect(faixa().getByRole('button', { name: 'Reuniões' }).getAttribute('aria-current')).toBe('page')
})

test('as próximas ficam no topo, da mais próxima à mais distante; as realizadas vêm abaixo, da mais recente à mais antiga', async () => {
  montarReunioes()
  const [, ...corpo] = await linhasDasReunioes()
  expect(corpo).toEqual([
    ['Próximas'],
    ['20/10/2026 09:30', 'Sensibilização', 'TSA', '—', 'Sala 1'],
    ['02/11/2026', 'Modelagem', 'TSB', 'Pagar Diária', '—'],
    ['Realizadas'],
    ['14/10/2026sem anotações', 'Sensibilização', 'TSA', '—', '—'],
    ['01/10/2026', 'Modelagem', 'TSA', 'Arquivar Pasta, Emitir Ofício', 'Link da chamada'],
    ['05/09/2026sem anotações', 'Sensibilização', 'TSB', '—', '—'],
  ])
})

test('a marca "sem anotações" não aparece na próxima, mesmo sem anotações', async () => {
  montarReunioes({ reunioes: [reuniao('r1', '2026-10-15')] })
  const [, , linha] = await linhasDasReunioes()
  expect(linha[0]).toBe('15/10/2026')
  expect(screen.queryByText('sem anotações')).toBeNull()
})

test('Administrador e Integrante veem Registrar reunião; a Consulta vê a lista sem nenhum botão de alteração', async () => {
  montarReunioes({ perfil: 'administrador' })
  await linhasDasReunioes()
  expect(screen.getByRole('button', { name: 'Registrar reunião' })).toBeTruthy()
  cleanup()
  montarReunioes({ perfil: 'consulta' })
  await linhasDasReunioes()
  expect(screen.queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})

test('filtra por setor e por tipo; o endereço guarda a escolha', async () => {
  montarReunioes()
  await linhasDasReunioes()
  fireEvent.change(filtros().getByLabelText('Setor'), { target: { value: 's2' } })
  expect((await linhasDasReunioes()).slice(1).map((linha) => linha[0])).toEqual(['Próximas', '02/11/2026', 'Realizadas', '05/09/2026sem anotações'])
  expect(window.location.hash).toBe('#/reunioes?setor=s2')
  fireEvent.change(filtros().getByLabelText('Tipo'), { target: { value: 'modelagem' } })
  await waitFor(() => expect(screen.queryByText('05/09/2026')).toBeNull())
  expect(screen.getByText('02/11/2026')).toBeTruthy()
  expect(window.location.hash).toBe('#/reunioes?setor=s2&tipo=modelagem')
})

test('filtra por período, com as duas pontas inclusivas', async () => {
  montarReunioes()
  await linhasDasReunioes()
  fireEvent.change(filtros().getByLabelText('De'), { target: { value: '2026-10-01' } })
  fireEvent.change(filtros().getByLabelText('Até'), { target: { value: '2026-10-14' } })
  await waitFor(() => expect(screen.queryByText('20/10/2026 09:30')).toBeNull())
  expect(screen.getByText('14/10/2026')).toBeTruthy()
  expect(screen.getByText('01/10/2026')).toBeTruthy()
  expect(screen.queryByText('05/09/2026')).toBeNull()
  expect(window.location.hash).toBe('#/reunioes?de=2026-10-01&ate=2026-10-14')
})

test('os filtros do endereço voltam ao recarregar a página', async () => {
  window.location.hash = '#/reunioes?tipo=modelagem'
  montarReunioes()
  const [, ...corpo] = await linhasDasReunioes()
  expect(corpo.map((linha) => linha[0])).toEqual(['Próximas', '02/11/2026', 'Realizadas', '01/10/2026'])
  expect((filtros().getByLabelText('Tipo') as HTMLSelectElement).value).toBe('modelagem')
})

test('sem resultado, avisa "Nenhuma reunião com esses filtros." e Limpar filtros traz a lista de volta', async () => {
  montarReunioes()
  await linhasDasReunioes()
  fireEvent.change(filtros().getByLabelText('De'), { target: { value: '2027-01-01' } })
  expect(await screen.findByText('Nenhuma reunião com esses filtros.')).toBeTruthy()
  fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0])
  expect(await screen.findByText('20/10/2026 09:30')).toBeTruthy()
  expect(window.location.hash).toBe('#/reunioes')
})

test('enquanto carrega, mostra o aviso de carregando', async () => {
  montarReunioes({ ajustar: (falso) => { falso.segurarLeitura = true } })
  expect(await screen.findByText('Carregando reuniões…')).toBeTruthy()
})

test('sem reuniões, avisa "Nenhuma reunião registrada." e oferece Registrar reunião a quem pode', async () => {
  montarReunioes({ reunioes: [] })
  expect(await screen.findByText('Nenhuma reunião registrada.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Registrar reunião' })).toBeTruthy()
  cleanup()
  montarReunioes({ reunioes: [], perfil: 'consulta' })
  expect(await screen.findByText('Nenhuma reunião registrada.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})

test('a falha ao carregar mostra o erro; Tentar de novo carrega a lista', async () => {
  const falso = montarReunioes({ ajustar: (f) => { f.falharLeitura = true } })
  expect(await screen.findByText('Não foi possível carregar as reuniões. Verifique a conexão e tente de novo.')).toBeTruthy()
  falso.falharLeitura = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('20/10/2026 09:30')).toBeTruthy()
})
