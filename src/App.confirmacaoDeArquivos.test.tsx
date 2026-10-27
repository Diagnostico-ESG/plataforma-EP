import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { ArquivosDoProcesso } from './processos/tipos'
import { cartaoDe, ETAPAS, montar, processo } from './testes/quadroDeTeste'
import { type Montagem, montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { agoraDoVerso } from './testes/versoDoCartao'
import { VersoesFalso } from './versoes/VersoesFalso'

// A Confirmação de arquivos (ticket 01 de travas-em-avisos, ADR 0028; histórias 135 a 138 e 141 a 147): mover para a frente
// da Modelagem piloto ou da Relatório e modelagem técnica, faltando o que a etapa pede, pergunta antes, e o processo só se move
// com [Avançar mesmo assim]. Pela lista Etapa do Agora e ao arrastar o cartão.

const NADA: ArquivosDoProcesso = { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false }
const TITULO_DA_PILOTO = 'Faltam os arquivos da Modelagem piloto.'
const TITULO_DA_TECNICA = 'Faltam os arquivos da Modelagem técnica.'
const TITULO_DAS_DUAS = 'Faltam os arquivos de duas etapas.'
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

/** O verso do p1 na etapa dada, com o que ele tem de arquivos. */
function montarVerso(etapa: string, arquivos: ArquivosDoProcesso, mais: Montagem = {}) {
  return montarNosCadastros({
    ...mais,
    ajustarProcessos: (falso) => {
      naEtapa(etapa)(falso)
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, arquivos } : processo))
      mais.ajustarProcessos?.(falso)
    },
  })
}

const irPara = async (id: string) => fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }), { target: { value: id } })
const janela = async (nome: string) => within(await screen.findByRole('dialog', { name: nome }))
const avancar = (aberta: ReturnType<typeof within>) => fireEvent.click(aberta.getByRole('button', { name: 'Avançar mesmo assim' }))

test('sair da Modelagem piloto sem versão piloto pergunta, com o texto da etapa, e o processo não se move', async () => {
  const { processos } = montarVerso('modelagem', NADA)
  await irPara('e3')
  const aberta = await janela(TITULO_DA_PILOTO)
  expect(aberta.getByText('Este processo ainda não tem a versão piloto. Você pode avançar agora e enviá-la depois.')).toBeTruthy()
  expect(aberta.queryByRole('button', { name: 'Enviar arquivos agora' })).toBeNull()
  expect(processos.chamadas).toEqual([])
})

test('[Avançar mesmo assim] move na hora, sem enviar nada, e a janela fecha', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA)
  await irPara('e3')
  avancar(await janela(TITULO_DA_PILOTO))
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(processos.chamadas[0]).toMatchObject({ acao: 'mover', id: 'p1', etapaId: 'e3', semArquivos: [{ etapa: 'modelagem', pecas: ['versao_piloto'] }] })
  expect(versoes.versoes.p1 ?? []).toEqual([])
  expect(screen.queryByRole('dialog', { name: TITULO_DA_PILOTO })).toBeNull()
})

test('[Cancelar] deixa o processo onde estava', async () => {
  const { processos } = montarVerso('modelagem', NADA)
  await irPara('e3')
  fireEvent.click((await janela(TITULO_DA_PILOTO)).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO_DA_PILOTO })).toBeNull())
  expect(processos.chamadas).toEqual([])
  expect(((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }) as HTMLSelectElement).selectedOptions[0].textContent).toBe('Modelagem piloto')
})

test('Esc (o fechamento do <dialog>) também deixa o processo onde estava', async () => {
  const { processos } = montarVerso('modelagem', NADA)
  await irPara('e3')
  fireEvent(await screen.findByRole('dialog', { name: TITULO_DA_PILOTO }), new Event('close'))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: TITULO_DA_PILOTO })).toBeNull())
  expect(processos.chamadas).toEqual([])
})

test('falha na gravação depois de [Avançar mesmo assim] mostra a mensagem de erro de sempre', async () => {
  const { processos } = montarVerso('modelagem', NADA, { ajustarProcessos: (falso) => { falso.falhaDeGravacao = 'conexão perdida' } })
  await irPara('e3')
  avancar(await janela(TITULO_DA_PILOTO))
  expect((await screen.findAllByText(/conexão perdida/)).length).toBeGreaterThan(0)
  expect(processos.chamadas).toEqual([])
})

test('a técnica diz só o que falta: o fluxograma, o relatório ou os dois', async () => {
  montarVerso('relatorio_modelagem_tecnica', { ...NADA, versaoPiloto: true })
  await irPara('e4')
  const aberta = await janela(TITULO_DA_TECNICA)
  expect(aberta.getByText('Este processo ainda não tem o fluxograma nem o relatório desta etapa. Você pode avançar agora e enviá-los depois.')).toBeTruthy()
  cleanup()
  montarVerso('relatorio_modelagem_tecnica', { ...NADA, versaoEmSequencia: true })
  await irPara('e4')
  const so = await janela(TITULO_DA_TECNICA)
  expect(so.getByText('Este processo ainda não tem o relatório desta etapa. Você pode avançar agora e enviá-lo depois.')).toBeTruthy()
})

test('passando pelas duas etapas, uma pergunta só com a lista; depois dela vem a chegada a Concluídos', async () => {
  const { processos } = montarVerso('nao_iniciados', NADA)
  await irPara('e8')
  const aberta = await janela(TITULO_DAS_DUAS)
  expect(aberta.getByText('Modelagem piloto: ainda não tem a versão piloto.')).toBeTruthy()
  expect(aberta.getByText('Modelagem técnica: ainda não tem o fluxograma nem o relatório desta etapa.')).toBeTruthy()
  avancar(aberta)
  const chegada = await janela('Levar Emitir Ofício a Concluídos')
  expect(processos.chamadas).toEqual([])
  fireEvent.click(chegada.getByRole('radio', { name: 'Concluir sem publicação' }))
  fireEvent.change(chegada.getByLabelText('Explicação'), { target: { value: 'Não será divulgado' } })
  fireEvent.click(chegada.getByRole('button', { name: 'Levar a Concluídos' }))
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(processos.chamadas[0]).toMatchObject({
    acao: 'mover', id: 'p1', etapaId: 'e8',
    semArquivos: [{ etapa: 'modelagem', pecas: ['versao_piloto'] }, { etapa: 'relatorio_modelagem_tecnica', pecas: ['versao', 'relatorio'] }],
  })
})

test('voltar e o processo que já estava adiante andam sem pergunta', async () => {
  const { processos } = montarVerso('relatorio_modelagem_tecnica', NADA)
  await irPara('e2')
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(screen.queryByRole('dialog', { name: /^Faltam/ })).toBeNull()
  cleanup()
  const adiante = montarVerso('revisao_interna', NADA)
  await irPara('e5')
  await waitFor(() => expect(adiante.processos.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e5' }]))
})

test('com os arquivos da etapa, mover não pergunta nada', async () => {
  const { processos } = montarVerso('modelagem', { ...NADA, versaoPiloto: true })
  await irPara('e3')
  await waitFor(() => expect(processos.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e3' }]))
})

test('ao arrastar o cartão, a mesma pergunta abre e o processo só se move com [Avançar mesmo assim]', async () => {
  window.location.hash = '#/processos'
  const emitir = processo('Emitir Ofício', { etapa: 'modelagem', processo: { arquivos: NADA } })
  const versoes = new VersoesFalso()
  versoes.processos[emitir.id] = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Modelagem piloto' }
  const falso = montar([emitir], 'integrante_ep', [], versoes)
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  const alvo = screen.getByRole('region', { name: ETAPAS.find((etapa) => etapa.codigo === 'relatorio_modelagem_tecnica')?.nome })
  fireEvent.dragOver(alvo, { dataTransfer })
  fireEvent.drop(alvo, { dataTransfer })
  const aberta = await janela(TITULO_DA_PILOTO)
  expect(falso.chamadas).toEqual([])
  avancar(aberta)
  await waitFor(() => expect(falso.chamadas).toHaveLength(1))
  expect(falso.chamadas[0]).toMatchObject({ acao: 'mover', id: emitir.id, etapaId: 'e3' })
})
