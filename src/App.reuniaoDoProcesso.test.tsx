import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { EventoDoCadastro } from './cadastros/tipos'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido, SituacaoDoProcesso } from './processos/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

// "Hoje" nos testes: só o Date é simulado, e os temporizadores seguem reais (o waitFor continua funcionando).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 14, 12, 0))
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

function processo(mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento', etapaAtual: null,
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, processoPaiId: null, processoPai: null,
    subprocessos: [], motivoDaSituacao: null, dataDaReuniao: null, etapasDoSetor: [], etapasDoProcesso: [], ...mudancas,
  }
}

function montar(mudancas: Partial<ProcessoLido> = {}, perfil: Perfil = 'integrante_ep') {
  const falso = new ProcessosFalso()
  falso.processos = [processo(mudancas)]
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso}
    versoes={new VersoesFalso()} />)
  return falso
}

async function linha() {
  return within(await screen.findByRole('region', { name: 'Reunião de modelagem piloto' }))
}

const campo = (secao: Awaited<ReturnType<typeof linha>>) =>
  secao.getByLabelText('Data da reunião de modelagem piloto') as HTMLInputElement

test.each([
  ['2026-10-20', 'marcada para 20/10/2026'],
  ['2026-10-14', 'marcada para 14/10/2026'],
  ['2026-10-10', 'realizada em 10/10/2026'],
  [null, 'não marcada'],
])('com a data %s, a linha diz "%s"', async (data, texto) => {
  montar({ dataDaReuniao: data })
  expect((await linha()).getByText(texto)).toBeTruthy()
})

test('marcar: escolher a data e [Salvar] grava e atualiza o texto', async () => {
  const falso = montar()
  const secao = await linha()
  fireEvent.change(campo(secao), { target: { value: '2026-10-20' } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect(await secao.findByText('marcada para 20/10/2026')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'reuniao', id: 'p1', nota: '2026-10-20' }])
})

test('trocar a data marcada', async () => {
  const falso = montar({ dataDaReuniao: '2026-10-14' })
  const secao = await linha()
  expect(campo(secao).value).toBe('2026-10-14')
  fireEvent.change(campo(secao), { target: { value: '2026-10-21' } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect(await secao.findByText('marcada para 21/10/2026')).toBeTruthy()
  expect(falso.processos[0].dataDaReuniao).toBe('2026-10-21')
})

test('[Remover] só aparece com data gravada e apaga sem pedir confirmação', async () => {
  const falso = montar({ dataDaReuniao: '2026-10-10' })
  const secao = await linha()
  fireEvent.click(secao.getByRole('button', { name: 'Remover' }))
  expect(await secao.findByText('não marcada')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(falso.processos[0].dataDaReuniao).toBeNull()
  expect(secao.queryByRole('button', { name: 'Remover' })).toBeNull()
})

test('[Salvar] desabilitado com o campo vazio e com a data igual à gravada', async () => {
  montar({ dataDaReuniao: '2026-10-14' })
  const secao = await linha()
  const salvar = secao.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement
  expect(salvar.disabled).toBe(true)
  fireEvent.change(campo(secao), { target: { value: '' } })
  expect(salvar.disabled).toBe(true)
  fireEvent.change(campo(secao), { target: { value: '2026-10-15' } })
  expect(salvar.disabled).toBe(false)
})

test('os botões ficam desabilitados durante a gravação', async () => {
  const falso = montar({ dataDaReuniao: '2026-10-14' })
  falso.marcarReuniao = () => new Promise<never>(() => {})
  const secao = await linha()
  fireEvent.change(campo(secao), { target: { value: '2026-10-15' } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect((secao.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true))
  expect((secao.getByRole('button', { name: 'Remover' }) as HTMLButtonElement).disabled).toBe(true)
})

test('falha: a mensagem em vermelho, com a data escolhida mantida no campo', async () => {
  const falso = montar()
  falso.falhaDeGravacao = 'falha de conexão simulada'
  const secao = await linha()
  fireEvent.change(campo(secao), { target: { value: '2026-10-20' } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  const alerta = await secao.findByRole('alert')
  expect(alerta.textContent).toBe('A data da reunião não foi salva: falha de conexão simulada.')
  expect(alerta.className).toBe('cadastros-falha')
  expect(campo(secao).value).toBe('2026-10-20')
})

test('recusa por perfil: a frase dos processos', async () => {
  const falso = montar()
  falso.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  const secao = await linha()
  fireEvent.change(campo(secao), { target: { value: '2026-10-20' } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('Seu perfil não permite alterar os processos.')
})

test.each<SituacaoDoProcesso>(['suspenso', 'cancelado', 'concluido'])('marca a data com o processo %s', async (situacao) => {
  const falso = montar({ situacao, motivoDaSituacao: situacao === 'concluido' ? null : 'Motivo inventado' })
  const secao = await linha()
  fireEvent.change(campo(secao), { target: { value: '2026-11-03' } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect(await secao.findByText('marcada para 03/11/2026')).toBeTruthy()
  expect(falso.processos[0].dataDaReuniao).toBe('2026-11-03')
})

test('Consulta vê a data, sem campo nem botões', async () => {
  montar({ dataDaReuniao: '2026-10-20' }, 'consulta')
  const secao = await linha()
  expect(secao.getByText('marcada para 20/10/2026')).toBeTruthy()
  expect(secao.queryByLabelText('Data da reunião de modelagem piloto')).toBeNull()
  expect(secao.queryByRole('button')).toBeNull()
})

test('o histórico do processo mostra só a troca da data, com o autor', async () => {
  const estado = { nome: 'Emitir Ofício', setor_sigla: 'TSA', situacao: 'em_andamento' }
  const troca: EventoDoCadastro = {
    id: 2, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao: 'editar', entidade: 'processo', entidadeRef: 'p1',
    antes: { ...estado, data_da_reuniao: '2026-10-14' }, depois: { ...estado, data_da_reuniao: '2026-10-20' },
  }
  const falso = montar()
  falso.historicoDosProcessos = { p1: [troca] }
  fireEvent.click(await screen.findByRole('tab', { name: 'Histórico' }))
  const [item] = await screen.findAllByRole('listitem')
  expect(within(item).getByText('Ana Teste')).toBeTruthy()
  expect(within(item).getByText('Antes: Reunião de modelagem piloto: 14/10/2026')).toBeTruthy()
  expect(within(item).getByText('Depois: Reunião de modelagem piloto: 20/10/2026')).toBeTruthy()
})

test('processo com data se exclui, sem recusa', async () => {
  const falso = montar({ dataDaReuniao: '2026-10-20' })
  fireEvent.click(await within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
    .findByRole('button', { name: 'Excluir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(falso.processos).toEqual([])
})
