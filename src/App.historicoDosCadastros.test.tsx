import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { AUTOR_DIRETO_NO_BANCO } from './acesso/historico'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'

beforeEach(() => {
  window.location.hash = '#/setores/historico'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SETOR_A = { sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }
const MACRO_1 = { codigo: 'MT01', nome: 'Macro Teste Um', descricao: null, categoria: 'apoio', ativo: true }
const VINCULO = {
  setor_id: 's1', setor_sigla: 'TSA', macroprocesso_id: 'm1', macroprocesso_nome: 'Macro Teste Um', observacao: null,
}
const SETOR_EXTINTO = { sigla: 'TSX', nome: 'Setor Extinto', observacoes: 'Fechou', ativo: true }

function evento(id: number, parcial: Partial<EventoDoCadastro> & Pick<EventoDoCadastro, 'acao' | 'entidade' | 'entidadeRef'>): EventoDoCadastro {
  return { id, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Pessoa Fictícia', antes: null, depois: null, ...parcial }
}

// Do mais recente (7) para o mais antigo (1), como o banco entrega.
const EVENTOS: EventoDoCadastro[] = [
  evento(7, { acao: 'excluir', entidade: 'setor', entidadeRef: 's9', antes: {
    ...SETOR_EXTINTO, macroprocessos: [{ macroprocesso_id: 'm1', codigo: 'MT01', nome: 'Macro Teste Um', observacao: 'Apoiava' }],
  } }),
  evento(6, { acao: 'editar', entidade: 'setor_envolvido', entidadeRef: 'm1:s1', antes: VINCULO, depois: { ...VINCULO, observacao: 'Apoia' } }),
  evento(5, { acao: 'criar', entidade: 'setor_envolvido', entidadeRef: 'm1:s1', depois: VINCULO, autor: null }),
  evento(4, { acao: 'editar', entidade: 'setor', entidadeRef: 's1', antes: SETOR_A, depois: { ...SETOR_A, nome: 'Setor Teste Novo' } }),
  evento(3, { acao: 'criar', entidade: 'macroprocesso', entidadeRef: 'm1', depois: MACRO_1 }),
  evento(2, { acao: 'criar', entidade: 'setor', entidadeRef: 's1', depois: SETOR_A }),
  evento(1, { acao: 'criar', entidade: 'setor', entidadeRef: 's9', depois: SETOR_EXTINTO }),
]

function montar(perfil: Perfil = 'integrante_ep', eventos: EventoDoCadastro[] = EVENTOS, ajustar?: (c: CadastrosFalso) => void) {
  const cadastros = new CadastrosFalso()
  cadastros.historico = eventos
  ajustar?.(cadastros)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} />)
  return cadastros
}

async function itensDaLista(): Promise<HTMLElement[]> {
  await screen.findByRole('combobox', { name: 'Item' })
  return screen.getAllByRole('listitem')
}

test('a aba Histórico lista as alterações da mais recente para a mais antiga, com data, autor, ação, item e antes e depois', async () => {
  montar()
  const itens = await itensDaLista()
  expect(itens).toHaveLength(7)
  expect(itens[0].textContent).toContain('Excluiu')
  expect(itens[0].textContent).toContain('TSX — Setor Extinto')
  expect(itens[6].textContent).toContain('Criou')
  expect(within(itens[3]).getByText('Pessoa Fictícia')).toBeTruthy()
  expect(itens[3].textContent).toMatch(/13\/10\/2026.*12:00/)
  expect(itens[3].textContent).toContain('Antes: Sigla: TSA; Nome: Setor Teste A; Observações: —; Situação: Ativo')
  expect(itens[3].textContent).toContain('Depois: Sigla: TSA; Nome: Setor Teste Novo; Observações: —; Situação: Ativo')
  expect(screen.getByRole('link', { name: 'Histórico' }).getAttribute('aria-current')).toBe('page')
})

test('mudança feita direto no banco aparece com o autor de configuração inicial', async () => {
  montar()
  const itens = await itensDaLista()
  expect(itens[2].textContent).toContain(AUTOR_DIRETO_NO_BANCO)
})

test('a exclusão mostra todos os campos que o item tinha, inclusive os macroprocessos em que o setor estava', async () => {
  montar()
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain(
    'Antes: Sigla: TSX; Nome: Setor Extinto; Observações: Fechou; Situação: Ativo; '
    + 'Macroprocessos: MT01 — Macro Teste Um (Apoiava)')
  expect(itens[0].textContent).toContain('Depois: —')
})

test('pôr, anotar e tirar um setor do macroprocesso aparecem com a sigla e o nome do macroprocesso', async () => {
  montar('integrante_ep', [
    evento(3, { acao: 'excluir', entidade: 'setor_envolvido', entidadeRef: 'm1:s1', antes: { ...VINCULO, observacao: 'Apoia' } }),
    EVENTOS[1],
    EVENTOS[2],
  ])
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain('Tirou o setor do macroprocesso')
  expect(itens[0].textContent).toContain('TSA em Macro Teste Um')
  expect(itens[1].textContent).toContain('Mudou a observação do setor no macroprocesso')
  expect(itens[1].textContent).toContain('Depois: Setor: TSA; Macroprocesso: Macro Teste Um; Observação: Apoia')
  expect(itens[2].textContent).toContain('Pôs o setor no macroprocesso')
})

test('o filtro Item lista todos os setores e macroprocessos do histórico, inclusive o excluído, pelo nome mais recente', async () => {
  montar()
  await itensDaLista()
  const seletor = screen.getByRole('combobox', { name: 'Item' })
  expect(within(seletor).getAllByRole('option').map((opcao) => opcao.textContent)).toEqual([
    'Todos os itens', 'MT01 — Macro Teste Um', 'TSA — Setor Teste Novo', 'TSX — Setor Extinto',
  ])
})

test('filtrar por um item excluído mostra o que aconteceu com ele', async () => {
  montar()
  await itensDaLista()
  fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), { target: { value: 's9' } })
  const itens = screen.getAllByRole('listitem')
  expect(itens).toHaveLength(2)
  expect(itens[0].textContent).toContain('Excluiu')
  expect(itens[1].textContent).toContain('Criou')
})

test('filtrar por um setor traz os eventos dele e os vínculos dele; filtrar por um macroprocesso, os dele e os vínculos', async () => {
  montar()
  await itensDaLista()
  const seletor = screen.getByRole('combobox', { name: 'Item' })
  fireEvent.change(seletor, { target: { value: 's1' } })
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
  fireEvent.change(seletor, { target: { value: 'm1' } })
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})

test('voltar a "Todos os itens" mostra tudo de novo', async () => {
  montar()
  await itensDaLista()
  const seletor = screen.getByRole('combobox', { name: 'Item' })
  fireEvent.change(seletor, { target: { value: 's9' } })
  fireEvent.change(seletor, { target: { value: '' } })
  expect(screen.getAllByRole('listitem')).toHaveLength(7)
})

test('enquanto carrega, mostra "Carregando histórico…"', async () => {
  montar('integrante_ep', EVENTOS, (cadastros) => { cadastros.segurarHistorico = true })
  expect(await screen.findByText('Carregando histórico…')).toBeTruthy()
})

test('sem alterações, mostra "Nenhuma alteração registrada ainda."', async () => {
  montar('integrante_ep', [])
  expect(await screen.findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
  expect(screen.queryByRole('listitem')).toBeNull()
})

test('falha ao carregar mostra o erro, e [Tentar de novo] carrega a lista quando a conexão volta', async () => {
  const cadastros = montar('integrante_ep', EVENTOS, (c) => { c.falharHistorico = true })
  const alerta = await screen.findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar o histórico.')
  cadastros.falharHistorico = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(7))
})

test.each<Perfil>(['consulta', 'integrante_ep', 'administrador'])('o perfil %s lê o histórico, sem botão de alteração', async (perfil) => {
  montar(perfil)
  expect(await itensDaLista()).toHaveLength(7)
  expect(screen.queryByRole('button', { name: /novo|excluir|desativar|editar/i })).toBeNull()
})

test('as etapas do setor aparecem no Histórico com o texto da ação e a nota, e entram no filtro pelo setor', async () => {
  const ETAPA = {
    setor_id: 's1', setor_sigla: 'TSA', etapa_codigo: 'sensibilizacao', etapa_nome: 'Reunião de sensibilização',
    status: 'pendente', iniciada_em: null, resolvida_em: null,
  }
  montar('consulta', [
    evento(9, { acao: 'dispensar', entidade: 'andamento', entidadeRef: 's1:a2', antes: ETAPA,
      depois: { ...ETAPA, status: 'dispensada', resolvida_em: '2026-10-13' }, motivo: 'Setor já conhecido' }),
    ...EVENTOS,
  ])
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain('Dispensou a etapa Reunião de sensibilização — TSA')
  expect(itens[0].textContent).toContain('Nota: Setor já conhecido')
  fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), { target: { value: 's1' } })
  expect(screen.getAllByRole('listitem')[0].textContent).toContain('Dispensou a etapa')
})

test('os responsáveis do setor aparecem no Histórico e entram no filtro pelo setor', async () => {
  const RESPONSAVEL = { setor_id: 's1', setor_sigla: 'TSA', nome: 'Ana Teste', email: null, cargo: 'Chefe de Teste' }
  montar('consulta', [
    evento(9, { acao: 'criar', entidade: 'responsavel_do_setor', entidadeRef: 's1:r1', depois: RESPONSAVEL }),
    ...EVENTOS,
  ])
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain('Criou Ana Teste — TSA')
  expect(itens[0].textContent).toContain('Cargo: Chefe de Teste')
  fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), { target: { value: 's1' } })
  expect(screen.getAllByRole('listitem')[0].textContent).toContain('Criou Ana Teste')
})

test('um processo excluído continua no Histórico, com o que tinha, inclusive as etapas', async () => {
  const antes = {
    nome: 'Emitir Ofício', setor_sigla: 'TSA', macroprocesso_nome: 'Macro Teste Um', tipo: 'a_classificar', origem: 'novo',
    situacao: 'em_andamento', andamentos: [{ etapa_nome: 'Reunião de modelagem', status: 'concluida' }],
  }
  montar('integrante_ep', [evento(9, { acao: 'excluir', entidade: 'processo', entidadeRef: 'p1', antes })])
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain('Excluiu')
  expect(itens[0].textContent).toContain('TSA — Emitir Ofício')
  expect(itens[0].textContent).toContain('Etapas: Reunião de modelagem (Concluída)')
})
