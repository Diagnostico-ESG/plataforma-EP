import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoSetor } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function etapa(ordem: number, parcial: Partial<EtapaDoSetor> & Pick<EtapaDoSetor, 'codigo' | 'nome'>): EtapaDoSetor {
  return {
    id: `a${ordem}`, ordem, obrigatoria: false, status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null,
    ...parcial,
  }
}

const RESPONSAVEIS = etapa(1, { codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis' })
const SENSIBILIZACAO = etapa(2, { codigo: 'sensibilizacao', nome: 'Reunião de sensibilização' })
const IDENTIFICACAO = etapa(3, { codigo: 'identificacao_processos', nome: 'Identificação dos processos', obrigatoria: true })

type Montagem = { perfil?: Perfil; etapas?: EtapaDoSetor[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', etapas = [RESPONSAVEIS, SENSIBILIZACAO, IDENTIFICACAO], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const processos = new ProcessosFalso()
  processos.etapasDoSetor = { s1: etapas }
  ajustar?.(processos)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={processos} versoes={new VersoesFalso()} />)
  return processos
}

// Abre o setor TSA e devolve a seção "Etapas do setor".
async function abrirEtapas() {
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  return within(await screen.findByRole('region', { name: 'Etapas do setor' }))
}

async function linhaDa(secao: ReturnType<typeof within>, nome: string) {
  return within((await secao.findByText(nome)).closest('li') as HTMLElement)
}

test('a tela do setor mostra as etapas do setor na ordem, com status, datas e nota', async () => {
  montar({ etapas: [
    { ...RESPONSAVEIS, status: 'dispensada', nota: 'Setor já conhecido', resolvidaEm: '2026-10-10' },
    { ...SENSIBILIZACAO, status: 'em_andamento', iniciadaEm: '2026-10-11' },
    IDENTIFICACAO,
  ] })
  const secao = await abrirEtapas()
  const itens = await secao.findAllByRole('listitem')
  expect(itens.map((item) => item.textContent)).toEqual([
    expect.stringContaining('Identificação dos responsáveis'),
    expect.stringContaining('Reunião de sensibilização'),
    expect.stringContaining('Identificação dos processos'),
  ])
  expect(itens[0].textContent).toContain('Dispensada')
  expect(itens[0].textContent).toContain('Conclusão: 10/10/2026')
  expect(itens[0].textContent).toContain('Nota: Setor já conhecido')
  expect(itens[1].textContent).toContain('Em andamento')
  expect(itens[1].textContent).toContain('Início: 11/10/2026')
  expect(itens[1].getAttribute('aria-current')).toBe('step')
  expect(itens[2].textContent).toContain('Pendente')
})

test('só a etapa atual tem ações; sendo opcional, inclui Dispensar', async () => {
  montar()
  const secao = await abrirEtapas()
  const atual = await linhaDa(secao, 'Identificação dos responsáveis')
  expect(atual.getAllByRole('button').map((botao) => botao.textContent))
    .toEqual(['Iniciar', 'Dispensar', 'Realizada anteriormente'])
  expect((await linhaDa(secao, 'Reunião de sensibilização')).queryAllByRole('button')).toHaveLength(0)
})

test('a etapa obrigatória não tem Dispensar', async () => {
  montar({ etapas: [{ ...RESPONSAVEIS, status: 'concluida' }, { ...SENSIBILIZACAO, status: 'concluida' }, IDENTIFICACAO] })
  const secao = await abrirEtapas()
  const atual = await linhaDa(secao, 'Identificação dos processos')
  expect(atual.getAllByRole('button').map((botao) => botao.textContent)).toEqual(['Iniciar', 'Realizada anteriormente'])
})

test('Iniciar grava e a etapa passa a em andamento, com Concluir', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Iniciar' }))
  const atual = await linhaDa(secao, 'Identificação dos responsáveis')
  expect(await atual.findByRole('button', { name: 'Concluir' })).toBeTruthy()
  expect(atual.getByText('Em andamento')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'iniciar', id: 'a1' }])
})

test('Concluir grava e a próxima etapa passa a ter as ações', async () => {
  const processos = montar({ etapas: [{ ...RESPONSAVEIS, status: 'em_andamento' }, SENSIBILIZACAO, IDENTIFICACAO] })
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Concluir' }))
  expect(await (await linhaDa(secao, 'Reunião de sensibilização')).findByRole('button', { name: 'Iniciar' })).toBeTruthy()
  expect((await linhaDa(secao, 'Identificação dos responsáveis')).getByText('Concluída')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'concluir', id: 'a1' }])
})

test('Dispensar abre a janela de nota: vazia não grava; com nota, grava e mostra a nota', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Dispensar' }))
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Identificação dos responsáveis?' }))
  expect(document.activeElement).toBe(janela.getByLabelText('Nota'))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Setor já conhecido' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(await secao.findByText('Nota: Setor já conhecido')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'dispensar', id: 'a1', nota: 'Setor já conhecido' }])
})

test('Esc fecha a janela de nota sem gravar', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Dispensar' }))
  const janela = screen.getByRole('dialog', { name: 'Dispensar a etapa Identificação dos responsáveis?' })
  fireEvent.change(within(janela).getByLabelText('Nota'), { target: { value: 'Rascunho' } })
  act(() => (janela as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(processos.chamadas).toEqual([])
})

test('Realizada anteriormente pede nota e grava', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis'))
    .getByRole('button', { name: 'Realizada anteriormente' }))
  const janela = within(screen.getByRole('dialog', {
    name: 'Registrar a etapa Identificação dos responsáveis como realizada anteriormente?' }))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  expect(await (await linhaDa(secao, 'Identificação dos responsáveis')).findByText('Realizada anteriormente')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'realizada', id: 'a1', nota: 'Feita em 2025' }])
})

test('a recusa de sequência do banco aparece como alerta, sem mudar a etapa', async () => {
  montar({ ajustar: (processos) => {
    processos.falhaDeGravacao = new TravaDoBanco('A etapa Identificação dos responsáveis ainda não foi resolvida.')
  } })
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Iniciar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A etapa Identificação dos responsáveis ainda não foi resolvida.')
  expect((await linhaDa(secao, 'Identificação dos responsáveis')).getByText('Pendente')).toBeTruthy()
})

test('falha comum de gravação mostra o motivo', async () => {
  montar({ ajustar: (processos) => { processos.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Iniciar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('a Consulta vê as etapas do setor sem nenhuma ação', async () => {
  montar({ perfil: 'consulta' })
  const secao = await abrirEtapas()
  expect(await secao.findAllByRole('listitem')).toHaveLength(3)
  expect(secao.queryAllByRole('button')).toHaveLength(0)
})

test('enquanto carrega, mostra "Carregando etapas do setor…"', async () => {
  montar({ ajustar: (processos) => { processos.segurarLeitura = true } })
  const secao = await abrirEtapas()
  expect(secao.getByRole('status').textContent).toBe('Carregando etapas do setor…')
})

test('falha ao carregar mostra o erro e Tentar de novo carrega as etapas', async () => {
  const processos = montar({ ajustar: (falso) => { falso.falharLeitura = true } })
  const secao = await abrirEtapas()
  expect((await secao.findByRole('alert')).textContent)
    .toContain('Não foi possível carregar as etapas do setor. Verifique a conexão e tente de novo.')
  processos.falharLeitura = false
  fireEvent.click(secao.getByRole('button', { name: 'Tentar de novo' }))
  expect(await secao.findAllByRole('listitem')).toHaveLength(3)
})
