import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/setores/historico'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SETOR_A = { sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }
const REUNIAO = {
  tipo: 'modelagem', setor_id: 's1', setor_sigla: 'TSA', data: '2026-10-14', hora: null, local: 'Sala 1', anotacoes: null,
  outros_participantes: [], processos: [{ id: 'p1', nome: 'Emitir Ofício' }],
}

function evento(id: number, parcial: Partial<EventoDoCadastro> & Pick<EventoDoCadastro, 'acao' | 'entidade' | 'entidadeRef'>): EventoDoCadastro {
  return { id, ocorridoEm: '2026-10-14T15:00:00Z', autor: 'Pessoa Fictícia', antes: null, depois: null, ...parcial }
}

// Do mais recente (3) para o mais antigo (1), como o banco entrega.
const EVENTOS: EventoDoCadastro[] = [
  evento(3, { acao: 'editar', entidade: 'reuniao', entidadeRef: 'r1', antes: REUNIAO, depois: { ...REUNIAO, local: 'Sala 2' } }),
  evento(2, { acao: 'criar', entidade: 'reuniao', entidadeRef: 'r1', depois: REUNIAO }),
  evento(1, { acao: 'criar', entidade: 'setor', entidadeRef: 's1', depois: SETOR_A }),
]

function montar() {
  const cadastros = new CadastrosFalso()
  cadastros.historico = EVENTOS
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'consulta' })} cadastros={cadastros}
    processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
}

test('os eventos de reunião aparecem no histórico geral, junto com os dos cadastros', async () => {
  montar()
  await screen.findByRole('combobox', { name: 'Item' })
  const itens = screen.getAllByRole('listitem')
  expect(itens).toHaveLength(3)
  expect(within(itens[0]).getByText('Editou')).toBeTruthy()
  expect(within(itens[0]).getByText('Reunião de modelagem de 14/10/2026 — TSA')).toBeTruthy()
  expect(within(itens[0]).getByText('Antes: Local: Sala 1')).toBeTruthy()
  expect(within(itens[0]).getByText('Depois: Local: Sala 2')).toBeTruthy()
  expect(within(itens[1]).getByText('Criou')).toBeTruthy()
  expect(within(itens[2]).getByText('TSA — Setor Teste A')).toBeTruthy()
})

test('a reunião entra no filtro "Item" e o filtro mostra só os eventos dela', async () => {
  montar()
  const filtro = await screen.findByRole('combobox', { name: 'Item' }) as HTMLSelectElement
  expect([...filtro.options].map((opcao) => opcao.textContent))
    .toEqual(['Todos os itens', 'Reunião de modelagem de 14/10/2026 — TSA', 'TSA — Setor Teste A'])
  fireEvent.change(filtro, { target: { value: 'r1' } })
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
