import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { EventoDoCadastro } from './cadastros/tipos'
import { fixarOHoje } from './testes/reunioesDeTeste'
import { montarNosCadastros } from './testes/reunioesNosCadastros'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
  fixarOHoje()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const painel = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
const secao = async () => within(await (await painel()).findByRole('region', { name: 'Reuniões do processo' }))

async function textosDaSecao(): Promise<string[]> {
  const itens = await (await secao()).findAllByRole('listitem')
  return itens.map((item) => item.textContent ?? '')
}

test('a seção mostra só as reuniões de modelagem que trataram o processo', async () => {
  montarNosCadastros()
  expect(await textosDaSecao()).toEqual(['01/10/2026 · Modelagem'])
})

test('outro processo mostra as reuniões dele, e o que nenhuma reunião tratou mostra "Nenhuma reunião."', async () => {
  window.location.hash = '#/processos/p3'
  montarNosCadastros()
  expect(await textosDaSecao()).toEqual(['02/11/2026 · Modelagem'])
  cleanup()
  window.location.hash = '#/processos/p4'
  montarNosCadastros()
  expect(await (await secao()).findByText('Nenhuma reunião.')).toBeTruthy()
})

test('enquanto as reuniões carregam, a seção avisa; se a leitura falha, mostra o erro e [Tentar de novo] recarrega', async () => {
  montarNosCadastros({ ajustarReunioes: (falso) => { falso.segurarLeitura = true } })
  expect((await (await secao()).findByRole('status')).textContent).toBe('Carregando reuniões…')
  cleanup()
  const { reunioes } = montarNosCadastros({ ajustarReunioes: (falso) => { falso.falharLeitura = true } })
  const tela = await secao()
  expect(await tela.findByText('Não foi possível carregar as reuniões. Verifique a conexão e tente de novo.')).toBeTruthy()
  reunioes.falharLeitura = false
  fireEvent.click(tela.getByRole('button', { name: 'Tentar de novo' }))
  expect(await tela.findAllByRole('listitem')).toHaveLength(1)
})

test('clicar numa reunião abre o painel dela na área Reuniões', async () => {
  montarNosCadastros()
  await textosDaSecao()
  fireEvent.click((await secao()).getByRole('button', { name: '01/10/2026' }))
  expect(await screen.findByRole('complementary', { name: 'Painel da reunião' })).toBeTruthy()
  expect(window.location.hash).toBe('#/reunioes/r4')
})

test('[Registrar reunião] abre o formulário com tipo modelagem, setor e processo preenchidos', async () => {
  montarNosCadastros()
  await textosDaSecao()
  fireEvent.click((await secao()).getByRole('button', { name: 'Registrar reunião' }))
  const formulario = within(await screen.findByRole('form', { name: 'Registrar reunião' }))
  expect((formulario.getByLabelText('Modelagem') as HTMLInputElement).checked).toBe(true)
  await waitFor(() => expect((formulario.getByLabelText('Setor') as HTMLSelectElement).value).toBe('s1'))
  expect((await formulario.findByLabelText('Emitir Ofício') as HTMLInputElement).checked).toBe(true)
  expect((formulario.getByLabelText('Arquivar Pasta (cancelado)') as HTMLInputElement).checked).toBe(false)
  expect(window.location.hash).toBe('#/reunioes/nova?para-setor=s1&para-tipo=modelagem&para-processo=p1')
})

test('registrar a partir do processo grava a reunião de modelagem com o processo', async () => {
  const { reunioes } = montarNosCadastros()
  await textosDaSecao()
  fireEvent.click((await secao()).getByRole('button', { name: 'Registrar reunião' }))
  const formulario = within(await screen.findByRole('form', { name: 'Registrar reunião' }))
  await formulario.findByLabelText('Emitir Ofício')
  fireEvent.change(formulario.getByLabelText('Data'), { target: { value: '2026-10-30' } })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(reunioes.gravacoes).toHaveLength(1))
  expect(reunioes.gravacoes[0].dados).toMatchObject({ tipo: 'modelagem', setorId: 's1', processosIds: ['p1'], data: '2026-10-30' })
})

test('a Consulta vê a seção sem [Registrar reunião]', async () => {
  montarNosCadastros({ perfil: 'consulta' })
  await textosDaSecao()
  expect((await secao()).queryByRole('button', { name: 'Registrar reunião' })).toBeNull()
})

const ESTADO = {
  tipo: 'modelagem', setor_id: 's1', setor_sigla: 'TSA', data: '2026-10-01', hora: null, local: 'Sala 1', anotacoes: null,
  outros_participantes: [], processos: [{ id: 'p1', nome: 'Emitir Ofício' }, { id: 'p2', nome: 'Arquivar Pasta' }],
}
const SEM_O_P1 = { ...ESTADO, processos: [{ id: 'p2', nome: 'Arquivar Pasta' }] }
const SO_O_P3 = { ...ESTADO, setor_id: 's2', setor_sigla: 'TSB', processos: [{ id: 'p3', nome: 'Pagar Diária' }] }

function eventoDeReuniao(id: number, ocorridoEm: string, mudancas: Partial<EventoDoCadastro>): EventoDoCadastro {
  return { id, ocorridoEm, autor: 'Pessoa Fictícia', acao: 'criar', entidade: 'reuniao', entidadeRef: 'r4', antes: null, depois: ESTADO, ...mudancas }
}

const EVENTO_DO_PROCESSO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-02T13:00:00Z', autor: 'Ana Teste', acao: 'criar', entidade: 'processo', entidadeRef: 'p1',
  antes: null, depois: { nome: 'Emitir Ofício', setor_sigla: 'TSA' },
}

async function abrirOHistorico(montagem: Parameters<typeof montarNosCadastros>[0] = {}) {
  const montado = montarNosCadastros({
    ...montagem,
    ajustarProcessos: (falso) => { falso.historicoDosProcessos = { p1: [EVENTO_DO_PROCESSO] } },
  })
  fireEvent.click(await (await painel()).findByRole('tab', { name: 'Histórico' }))
  return montado
}

test('o Histórico do processo junta os eventos de reunião em que ele aparece, antes ou depois, do mais recente ao mais antigo', async () => {
  await abrirOHistorico({
    ajustarReunioes: (falso) => {
      falso.historico = [
        eventoDeReuniao(10, '2026-10-05T13:00:00Z', {}),
        eventoDeReuniao(11, '2026-10-06T13:00:00Z', { entidadeRef: 'r2', depois: SO_O_P3 }),
        eventoDeReuniao(12, '2026-10-07T13:00:00Z', { acao: 'editar', antes: ESTADO, depois: SEM_O_P1 }),
        eventoDeReuniao(13, '2026-10-08T13:00:00Z', { acao: 'excluir', entidadeRef: 'r9', antes: ESTADO, depois: null }),
      ]
    },
  })
  const itens = await (await painel()).findAllByRole('listitem')
  expect(itens.map((item) => within(item).getAllByText(/^(Criou|Editou|Excluiu)$/)[0].textContent))
    .toEqual(['Excluiu', 'Editou', 'Criou', 'Criou'])
  expect(within(itens[0]).getByText(/^Antes: Tipo: Modelagem; Setor: TSA; Data: 01\/10\/2026/)).toBeTruthy()
  expect(within(itens[3]).getByText('Ana Teste')).toBeTruthy()
})

test('Histórico: se os eventos de reunião falham, mostra o erro e [Tentar de novo] recarrega', async () => {
  const { reunioes } = await abrirOHistorico({ ajustarReunioes: (falso) => { falso.falharEventosDoProcesso = true } })
  const tela = await painel()
  expect(await tela.findByText(/Não foi possível carregar o histórico/)).toBeTruthy()
  reunioes.falharEventosDoProcesso = false
  fireEvent.click(tela.getByRole('button', { name: 'Tentar de novo' }))
  expect(await tela.findAllByRole('listitem')).toHaveLength(1)
})
