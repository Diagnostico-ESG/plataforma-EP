import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastroInexistente } from './cadastros/cadastroInexistente'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'

beforeEach(() => {
  window.location.hash = '#/setores/macroprocessos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// TSA e TSX (inativo) já estão em "Planejamento Inventado"; TSB e TSC ainda não; "Gestão Fictícia" não tem setores.
function cadastrosComSetores() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true },
    { id: 's3', sigla: 'TSC', nome: 'Setor Teste C', observacoes: null, ativo: true },
    { id: 's4', sigla: 'TSX', nome: 'Setor Teste Extinto', observacoes: null, ativo: false },
  ]
  cadastros.macroprocessos = [
    { id: 'm1', codigo: 'MPT01', nome: 'Planejamento Inventado', descricao: null, categoria: null, ativo: true },
    { id: 'm2', codigo: 'MPT02', nome: 'Gestão Fictícia', descricao: null, categoria: null, ativo: true },
  ]
  cadastros.vinculos = [
    { macroprocessoId: 'm1', setorId: 's1', observacao: 'Papel de A' },
    { macroprocessoId: 'm1', setorId: 's4', observacao: null },
  ]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep') {
  const cadastros = cadastrosComSetores()
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} />)
  return cadastros
}

async function abrirSecao(nome = 'Planejamento Inventado') {
  fireEvent.click(await screen.findByRole('cell', { name: nome }))
  return within(await screen.findByRole('region', { name: 'Setores envolvidos' }))
}

function opcoesDoSeletor(secao: ReturnType<typeof within>) {
  const seletor = secao.getByRole('combobox', { name: 'Setor a pôr' })
  return within(seletor).getAllByRole('option').map((opcao) => opcao.textContent)
}

function linhaDe(secao: ReturnType<typeof within>, sigla: string) {
  return within(secao.getByRole('cell', { name: sigla }).closest('tr') as HTMLElement)
}

test('lista sigla, nome, observação editável e [Tirar] de cada setor envolvido, na ordem da sigla', async () => {
  montar()
  const secao = await abrirSecao()
  const linha = linhaDe(secao, 'TSA')
  expect(linha.getByText('Setor Teste A')).toBeTruthy()
  expect((linha.getByLabelText('Observação de TSA') as HTMLInputElement).value).toBe('Papel de A')
  expect(linha.getByRole('button', { name: 'Tirar TSA' })).toBeTruthy()
  expect(secao.getAllByRole('row').slice(1).map((l) => within(l).getAllByRole('cell')[0].textContent)).toEqual(['TSA', 'TSX'])
})

test('macroprocesso sem setores mostra "Nenhum setor envolvido ainda."', async () => {
  montar()
  const secao = await abrirSecao('Gestão Fictícia')
  expect(secao.getByText('Nenhum setor envolvido ainda.')).toBeTruthy()
})

test('setor inativo envolvido aparece marcado "Inativo" e continua com [Tirar]', async () => {
  montar()
  const linha = linhaDe(await abrirSecao(), 'TSX')
  expect(linha.getByText('Inativo')).toBeTruthy()
  expect(linha.getByRole('button', { name: 'Tirar TSX' })).toBeTruthy()
})

test('o seletor só oferece setores ativos que ainda não estão no macroprocesso', async () => {
  montar()
  const secao = await abrirSecao()
  await waitFor(() => expect(opcoesDoSeletor(secao)).toEqual([
    'Escolha um setor', 'TSB — Setor Teste B', 'TSC — Setor Teste C']))
})

test('[Pôr setor] só habilita depois de escolher um setor', async () => {
  montar()
  const secao = await abrirSecao()
  const botao = secao.getByRole('button', { name: 'Pôr setor' }) as HTMLButtonElement
  expect(botao.disabled).toBe(true)
  await waitFor(() => expect(opcoesDoSeletor(secao)).toContain('TSB — Setor Teste B'))
  fireEvent.change(secao.getByRole('combobox', { name: 'Setor a pôr' }), { target: { value: 's2' } })
  expect(botao.disabled).toBe(false)
})

test('pôr grava na hora: o setor entra na lista, sai do seletor e não há janela de confirmação', async () => {
  const cadastros = montar()
  const secao = await abrirSecao()
  await waitFor(() => expect(opcoesDoSeletor(secao)).toContain('TSB — Setor Teste B'))
  fireEvent.change(secao.getByRole('combobox', { name: 'Setor a pôr' }), { target: { value: 's2' } })
  fireEvent.click(secao.getByRole('button', { name: 'Pôr setor' }))
  expect(await secao.findByRole('cell', { name: 'TSB' })).toBeTruthy()
  expect(opcoesDoSeletor(secao)).toEqual(['Escolha um setor', 'TSC — Setor Teste C'])
  expect(cadastros.vinculos.some((v) => v.macroprocessoId === 'm1' && v.setorId === 's2')).toBe(true)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('tirar grava na hora, sem janela: a linha some e o setor volta ao seletor', async () => {
  const cadastros = montar()
  const secao = await abrirSecao()
  fireEvent.click(secao.getByRole('button', { name: 'Tirar TSA' }))
  await waitFor(() => expect(secao.queryByRole('cell', { name: 'TSA' })).toBeNull())
  await waitFor(() => expect(opcoesDoSeletor(secao)).toContain('TSA — Setor Teste A'))
  expect(cadastros.vinculos.some((v) => v.setorId === 's1')).toBe(false)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('a observação grava ao sair do campo, só se mudou, e vazia grava nulo', async () => {
  const cadastros = montar()
  const gravar = vi.spyOn(cadastros, 'mudarObservacaoDoSetorEnvolvido')
  const campo = linhaDe(await abrirSecao(), 'TSA').getByLabelText('Observação de TSA')
  fireEvent.blur(campo)
  expect(gravar).not.toHaveBeenCalled()
  fireEvent.change(campo, { target: { value: 'Novo papel de A' } })
  fireEvent.blur(campo)
  await waitFor(() => expect(gravar).toHaveBeenCalledWith('m1', 's1', 'Novo papel de A'))
  fireEvent.change(campo, { target: { value: '' } })
  fireEvent.blur(campo)
  await waitFor(() => expect(gravar).toHaveBeenLastCalledWith('m1', 's1', null))
  await waitFor(() => expect(cadastros.vinculos[0].observacao).toBeNull())
})

test('falha ao pôr mostra a recusa em vermelho ao lado do seletor e a lista não muda', async () => {
  const cadastros = montar()
  const secao = await abrirSecao()
  await waitFor(() => expect(opcoesDoSeletor(secao)).toContain('TSB — Setor Teste B'))
  cadastros.falhaDeGravacao = new TravaDoBanco('O setor TSB já está neste macroprocesso.')
  fireEvent.change(secao.getByRole('combobox', { name: 'Setor a pôr' }), { target: { value: 's2' } })
  fireEvent.click(secao.getByRole('button', { name: 'Pôr setor' }))
  const aviso = await secao.findByRole('alert')
  expect(aviso.textContent).toBe('O setor TSB já está neste macroprocesso.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect(secao.queryByRole('cell', { name: 'TSB' })).toBeNull()
})

test('falha ao tirar mostra o motivo na linha, em vermelho, e a linha continua', async () => {
  const cadastros = montar()
  const secao = await abrirSecao()
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(secao.getByRole('button', { name: 'Tirar TSA' }))
  const aviso = await linhaDe(secao, 'TSA').findByRole('alert')
  expect(aviso.textContent).toBe('A alteração não foi salva: erro inesperado do banco (falha simulada).')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect(secao.getByRole('cell', { name: 'TSA' })).toBeTruthy()
})

test('falha ao gravar a observação mostra o motivo na linha e mantém o texto digitado', async () => {
  const cadastros = montar()
  const secao = await abrirSecao()
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  const campo = linhaDe(secao, 'TSA').getByLabelText('Observação de TSA') as HTMLInputElement
  fireEvent.change(campo, { target: { value: 'Texto que não gravou' } })
  fireEvent.blur(campo)
  const aviso = await linhaDe(secao, 'TSA').findByRole('alert')
  expect(aviso.textContent).toBe('A alteração não foi salva: erro inesperado do banco (falha simulada).')
  expect(campo.value).toBe('Texto que não gravou')
})

test('macroprocesso excluído por outra pessoa durante a operação vira o aviso próprio', async () => {
  const cadastros = montar()
  const secao = await abrirSecao()
  cadastros.falhaDeGravacao = new CadastroInexistente()
  fireEvent.click(secao.getByRole('button', { name: 'Tirar TSA' }))
  expect(await screen.findByText(/Este cadastro não existe mais/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})

test('falha ao carregar os setores do seletor mostra o erro com [Tentar de novo] sem esconder a lista', async () => {
  const cadastros = cadastrosComSetores()
  cadastros.falharLista = true
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} processos={new ProcessosFalso()} />)
  const secao = await abrirSecao()
  expect(await secao.findByText('Não foi possível carregar os setores. Verifique a conexão e tente de novo.')).toBeTruthy()
  expect(secao.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  expect(secao.getByRole('cell', { name: 'TSA' })).toBeTruthy()
})

test('a Consulta vê os vínculos sem [Tirar], sem seletor e sem observação editável', async () => {
  montar('consulta')
  const secao = await abrirSecao()
  const linha = linhaDe(secao, 'TSA')
  expect(linha.getByText('Papel de A')).toBeTruthy()
  expect(linhaDe(secao, 'TSX').getByText('Inativo')).toBeTruthy()
  expect(secao.queryByRole('button', { name: /Tirar/ })).toBeNull()
  expect(secao.queryByRole('combobox')).toBeNull()
  expect(secao.queryByRole('textbox')).toBeNull()
  expect(secao.queryByRole('button', { name: 'Pôr setor' })).toBeNull()
})

test('a Consulta também vê "Nenhum setor envolvido ainda."', async () => {
  montar('consulta')
  expect((await abrirSecao('Gestão Fictícia')).getByText('Nenhum setor envolvido ainda.')).toBeTruthy()
})
