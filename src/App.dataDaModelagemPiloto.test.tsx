import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import type { EventoDoCadastro } from './cadastros/tipos'
import type { ProcessoLido, SituacaoDoProcesso } from './processos/tipos'
import { escolherNoMenuDoProcesso, janelasPorCima } from './testes/versoDoCartao'
import { montarVerso, processoLido } from './testes/processoNoVerso'

// "Hoje" nos testes: só o Date é simulado, e os temporizadores seguem reais (o waitFor continua funcionando).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 14, 12, 0))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const ROTULO = 'Data da modelagem piloto'

function montar(mudancas: Partial<ProcessoLido> = {}, etapa = 'modelagem', perfil: Perfil = 'integrante_ep') {
  return montarVerso(processoLido(mudancas, etapa), perfil)
}

/** A linha da etapa Modelagem piloto nas Etapas: a data vive ali, e não mais no lado direito do verso. */
async function linha() {
  const botao = await screen.findByRole('button', { name: /^Modelagem piloto:/ })
  return within(botao.closest('li') as HTMLElement)
}

type Linha = Awaited<ReturnType<typeof linha>>

const campo = (secao: Linha) => secao.getByLabelText(ROTULO) as HTMLInputElement

async function editar(rotulo: 'Registrar data' | 'Alterar data' = 'Registrar data'): Promise<Linha> {
  const secao = await linha()
  fireEvent.click(secao.getByRole('button', { name: rotulo }))
  return secao
}

function gravarData(secao: Linha, data: string) {
  fireEvent.change(campo(secao), { target: { value: data } })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
}

test('com data, a linha da Modelagem piloto diz "Realizada em dd/mm/aaaa" e oferece [Alterar data]', async () => {
  montar({ dataDaModelagemPiloto: '2026-10-10' })
  const secao = await linha()
  expect(secao.getByText(/Realizada em/).textContent).toBe('Realizada em 10/10/2026')
  expect(secao.getByText('10/10/2026').tagName).toBe('TIME')
  expect(secao.getByRole('button', { name: 'Alterar data' })).toBeTruthy()
  expect(secao.queryByLabelText(ROTULO)).toBeNull()
})

test('sem data, a linha só oferece [Registrar data], sem "Ainda não marcada" nem "próxima"', async () => {
  montar()
  const secao = await linha()
  expect(secao.getByRole('button', { name: 'Registrar data' })).toBeTruthy()
  expect(secao.queryByText(/Ainda não marcada|próxima|Realizada em/)).toBeNull()
})

test('o lado direito do verso não tem mais a seção da data', async () => {
  montar({ dataDaModelagemPiloto: '2026-10-10' })
  await linha()
  expect(screen.queryByRole('region', { name: ROTULO })).toBeNull()
  expect(screen.queryByRole('heading', { name: ROTULO })).toBeNull()
})

test('registrar: [Registrar data] abre o campo sem [Remover]; [Salvar] grava e volta à linha, sem mexer na etapa', async () => {
  const falso = montar()
  const secao = await editar()
  expect(secao.queryByRole('button', { name: 'Remover' })).toBeNull()
  gravarData(secao, '2026-10-10')
  expect((await secao.findByText(/Realizada em/)).textContent).toBe('Realizada em 10/10/2026')
  expect(secao.queryByLabelText(ROTULO)).toBeNull()
  expect(falso.chamadas).toEqual([{ acao: 'data_da_modelagem_piloto', id: 'p1', nota: '2026-10-10' }])
  expect(falso.processos[0].etapaAtual?.codigo).toBe('modelagem')
  expect(falso.processos[0].etiqueta).toBe('a_fazer')
})

test('alterar: o campo abre com a data gravada', async () => {
  const falso = montar({ dataDaModelagemPiloto: '2026-10-08' })
  const secao = await editar('Alterar data')
  expect(campo(secao).value).toBe('2026-10-08')
  gravarData(secao, '2026-10-09')
  expect((await secao.findByText(/Realizada em/)).textContent).toBe('Realizada em 09/10/2026')
  expect(falso.processos[0].dataDaModelagemPiloto).toBe('2026-10-09')
})

test('[Cancelar] volta à linha sem gravar', async () => {
  const falso = montar({ dataDaModelagemPiloto: '2026-10-08' })
  const secao = await editar('Alterar data')
  fireEvent.change(campo(secao), { target: { value: '2026-10-09' } })
  fireEvent.click(secao.getByRole('button', { name: 'Cancelar' }))
  expect(secao.getByText(/Realizada em/).textContent).toBe('Realizada em 08/10/2026')
  expect(secao.queryByLabelText(ROTULO)).toBeNull()
  expect(falso.chamadas).toEqual([])
})

test('o foco vai ao campo ao abrir e volta ao botão ao cancelar ou salvar', async () => {
  montar({ dataDaModelagemPiloto: '2026-10-08' })
  const secao = await editar('Alterar data')
  expect(document.activeElement).toBe(campo(secao))
  fireEvent.click(secao.getByRole('button', { name: 'Cancelar' }))
  expect(document.activeElement).toBe(secao.getByRole('button', { name: 'Alterar data' }))
  fireEvent.click(secao.getByRole('button', { name: 'Alterar data' }))
  gravarData(secao, '2026-10-09')
  await waitFor(() => expect(document.activeElement).toBe(secao.getByRole('button', { name: 'Alterar data' })))
})

test('[Remover] só aparece com data gravada e apaga sem pedir confirmação', async () => {
  const falso = montar({ dataDaModelagemPiloto: '2026-10-10' })
  const secao = await editar('Alterar data')
  fireEvent.click(secao.getByRole('button', { name: 'Remover' }))
  expect(await secao.findByRole('button', { name: 'Registrar data' })).toBeTruthy()
  expect(janelasPorCima()).toEqual([])
  expect(falso.processos[0].dataDaModelagemPiloto).toBeNull()
})

test('[Salvar] desabilitado com o campo vazio e com a data igual à gravada', async () => {
  montar({ dataDaModelagemPiloto: '2026-10-08' })
  const secao = await editar('Alterar data')
  const salvar = secao.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement
  expect(salvar.disabled).toBe(true)
  fireEvent.change(campo(secao), { target: { value: '' } })
  expect(salvar.disabled).toBe(true)
  fireEvent.change(campo(secao), { target: { value: '2026-10-09' } })
  expect(salvar.disabled).toBe(false)
})

test.each([['Revisão interna', 'revisao_interna'], ['Concluídos', 'concluidos']])(
  'com o processo em %s, a data se registra',
  async (_nome, etapa) => {
    const falso = montar({ situacao: etapa === 'concluidos' ? 'concluido' : 'em_andamento' }, etapa)
    gravarData(await editar(), '2026-10-10')
    expect((await (await linha()).findByText(/Realizada em/)).textContent).toBe('Realizada em 10/10/2026')
    expect(falso.processos[0].dataDaModelagemPiloto).toBe('2026-10-10')
  },
)

test('em Não iniciados, a linha não oferece registrar', async () => {
  montar({}, 'nao_iniciados')
  const secao = await linha()
  expect(secao.queryByRole('button', { name: /data/i })).toBeNull()
  expect(secao.queryByText(/Realizada em/)).toBeNull()
})

test('processo que voltou para Não iniciados com data registrada continua mostrando a data, só para leitura', async () => {
  montar({ dataDaModelagemPiloto: '2026-10-08' }, 'nao_iniciados')
  const secao = await linha()
  expect(secao.getByText(/Realizada em/).textContent).toBe('Realizada em 08/10/2026')
  expect(secao.queryByRole('button', { name: /data/i })).toBeNull()
})

test.each<SituacaoDoProcesso>(['suspenso', 'cancelado'])('processo %s: a data é só leitura, e sem data nada aparece', async (situacao) => {
  montar({ situacao, motivoDaSituacao: 'Motivo inventado', dataDaModelagemPiloto: '2026-10-08' }, 'revisao_interna')
  const secao = await linha()
  expect(secao.getByText(/Realizada em/).textContent).toBe('Realizada em 08/10/2026')
  expect(secao.queryByRole('button', { name: /data/i })).toBeNull()
  cleanup()
  montar({ situacao, motivoDaSituacao: 'Motivo inventado' }, 'revisao_interna')
  expect((await linha()).queryByText(/Realizada em/)).toBeNull()
})

test('Consulta vê a data, sem botões; sem data, nada aparece', async () => {
  montar({ dataDaModelagemPiloto: '2026-10-08' }, 'revisao_interna', 'consulta')
  const secao = await linha()
  expect(secao.getByText(/Realizada em/).textContent).toBe('Realizada em 08/10/2026')
  expect(secao.queryByRole('button', { name: /data/i })).toBeNull()
})

test('data depois de hoje é recusada antes de enviar, com a data digitada e o limite', async () => {
  const falso = montar()
  const secao = await editar()
  gravarData(secao, '2026-10-20')
  expect((await secao.findByRole('alert')).textContent).toBe(
    'A data da modelagem piloto não pode ser depois de hoje: recebido 20/10/2026, limite 14/10/2026.')
  expect(falso.chamadas).toEqual([])
  expect(campo(secao).value).toBe('2026-10-20')
})

test('a data de hoje (em Brasília) é aceita', async () => {
  const falso = montar()
  gravarData(await editar(), '2026-10-14')
  await waitFor(() => expect(falso.processos[0].dataDaModelagemPiloto).toBe('2026-10-14'))
})

test('enquanto grava, o campo e os botões ficam desabilitados', async () => {
  const falso = montar({ dataDaModelagemPiloto: '2026-10-08' })
  falso.marcarDataDaModelagemPiloto = () => new Promise<never>(() => {})
  const secao = await editar('Alterar data')
  gravarData(secao, '2026-10-09')
  await waitFor(() => expect((secao.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true))
  expect(campo(secao).disabled).toBe(true)
  expect((secao.getByRole('button', { name: 'Remover' }) as HTMLButtonElement).disabled).toBe(true)
})

test('falha: a mensagem abaixo do campo, a data escolhida no campo e a anterior gravada', async () => {
  const falso = montar({ dataDaModelagemPiloto: '2026-10-08' })
  falso.falhaDeGravacao = 'falha de conexão simulada'
  const secao = await editar('Alterar data')
  gravarData(secao, '2026-10-09')
  const alerta = await secao.findByRole('alert')
  expect(alerta.textContent).toBe('A Data da modelagem piloto não foi salva: falha de conexão simulada.')
  expect(alerta.className).toBe('cadastros-falha')
  expect(campo(secao).value).toBe('2026-10-09')
  expect(falso.processos[0].dataDaModelagemPiloto).toBe('2026-10-08')
})

test('recusa por perfil: a frase dos processos', async () => {
  const falso = montar()
  falso.falhaDeGravacao = new TravaDoBanco('Seu perfil não permite alterar os processos.')
  const secao = await editar()
  gravarData(secao, '2026-10-10')
  expect((await secao.findByRole('alert')).textContent).toBe('Seu perfil não permite alterar os processos.')
})

test('o histórico do processo mostra só a troca da data, com o autor', async () => {
  const estado = { nome: 'Emitir Ofício', setor_sigla: 'TSA', situacao: 'em_andamento' }
  const troca: EventoDoCadastro = {
    id: 2, ocorridoEm: '2026-10-14T13:00:00Z', autor: 'Ana Teste', acao: 'editar', entidade: 'processo', entidadeRef: 'p1',
    antes: { ...estado, data_da_modelagem_piloto: '2026-10-08' }, depois: { ...estado, data_da_modelagem_piloto: '2026-10-10' },
  }
  const falso = montar()
  falso.historicoDosProcessos = { p1: [troca] }
  await escolherNoMenuDoProcesso('Histórico')
  // O item pelo texto da troca: o Quadro atrás tem outras listas (a legenda das etiquetas).
  const item = (await screen.findByText('Antes: Data da modelagem piloto: 08/10/2026')).closest('li') as HTMLElement
  expect(within(item).getByRole('img', { name: 'Ana Teste' })).toBeTruthy()
  expect(within(item).getByText('Antes: Data da modelagem piloto: 08/10/2026')).toBeTruthy()
  expect(within(item).getByText('Depois: Data da modelagem piloto: 10/10/2026')).toBeTruthy()
})

test('processo com data se exclui, sem recusa', async () => {
  const falso = montar({ dataDaModelagemPiloto: '2026-10-10' })
  await escolherNoMenuDoProcesso('Excluir')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir processo' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos'))
  expect(falso.processos).toEqual([])
})
