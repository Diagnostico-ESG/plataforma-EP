import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { ArquivosDoProcesso } from './processos/tipos'
import { cartaoDe, ETAPAS, montar, processo } from './testes/quadroDeTeste'
import { type Montagem, montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { BPM_VALIDO, versaoDeTeste } from './testes/versoesDeTeste'
import { agoraDoVerso } from './testes/versoDoCartao'
import { VersoesFalso } from './versoes/VersoesFalso'

// A trava de arquivos (ticket 11 de documentos-versoes, ADR 0025; histórias 97 a 105): mover para a frente da Modelagem
// piloto ou da Relatório e modelagem técnica, faltando o que a etapa pede, abre uma janela com o envio ali mesmo, e só
// depois do envio o processo se move. Pela lista Etapa do Agora e ao arrastar o cartão.

const NADA: ArquivosDoProcesso = { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false }
const DOCX = new File(['relatorio'], 'relatorio.docx')
const FRASE_DA_PILOTO = 'Para sair da Modelagem piloto, envie a versão piloto (.bpm).'
const FRASE_DA_TECNICA = 'Para sair da Relatório e modelagem técnica, envie a versão e o relatório.'
const AVISO_DO_MOVIMENTO = 'Os arquivos foram enviados, mas o processo não foi movido.'
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
const botaoDeEnviar = (aberta: ReturnType<typeof within>) => aberta.getByRole('button', { name: 'Enviar e mover' }) as HTMLButtonElement
const escolher = (aberta: ReturnType<typeof within>, rotulo: string, arquivo: File) =>
  fireEvent.change(aberta.getByLabelText(rotulo), { target: { files: [arquivo] } })

async function enviar(aberta: ReturnType<typeof within>, ...escolhas: [string, File][]) {
  for (const [rotulo, arquivo] of escolhas) escolher(aberta, rotulo, arquivo)
  await waitFor(() => expect(botaoDeEnviar(aberta).disabled).toBe(false))
  fireEvent.click(botaoDeEnviar(aberta))
}

test('sair da Modelagem piloto sem versão piloto abre a janela, com só o envio da piloto, e o processo não se move', async () => {
  const { processos } = montarVerso('modelagem', NADA)
  await irPara('e3')
  const aberta = await janela(FRASE_DA_PILOTO)
  expect(aberta.getByRole('form', { name: 'Enviar versão piloto' })).toBeTruthy()
  expect(aberta.queryByLabelText('Relatório (.docx)')).toBeNull()
  expect(botaoDeEnviar(aberta).disabled).toBe(true)
  expect(processos.chamadas).toEqual([])
})

test('[Enviar e mover] envia a versão piloto e depois move o processo', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA)
  await irPara('e3')
  await enviar(await janela(FRASE_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  await waitFor(() => expect(processos.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e3' }]))
  expect(versoes.versoes.p1).toHaveLength(1)
  expect(versoes.versoes.p1[0].piloto).toBe(true)
  expect(screen.queryByRole('dialog', { name: FRASE_DA_PILOTO })).toBeNull()
})

test('fechar a janela sem enviar deixa o processo onde estava', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA)
  await irPara('e3')
  fireEvent.click((await janela(FRASE_DA_PILOTO)).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: FRASE_DA_PILOTO })).toBeNull())
  expect(processos.chamadas).toEqual([])
  expect(versoes.versoes.p1 ?? []).toEqual([])
  expect(((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }) as HTMLSelectElement).selectedOptions[0].textContent).toBe('Modelagem piloto')
})

test('falha no envio: nada se move, a janela fica aberta e o arquivo continua escolhido', async () => {
  const { processos } = montarVerso('modelagem', NADA, { ajustarVersoes: (versoes) => { versoes.falharNoArquivo = 1 } })
  await irPara('e3')
  const aberta = await janela(FRASE_DA_PILOTO)
  await enviar(aberta, ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  expect((await aberta.findByRole('alert')).textContent).toContain('não chegou ao Drive')
  expect(processos.chamadas).toEqual([])
  expect(aberta.getByText(/fluxo\.bpm/)).toBeTruthy()
})

test('falha no movimento depois do envio avisa que os arquivos foram enviados', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA, { ajustarProcessos: (falso) => { falso.falhaDeGravacao = 'conexão perdida' } })
  await irPara('e3')
  await enviar(await janela(FRASE_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  expect((await screen.findAllByText(AVISO_DO_MOVIMENTO)).length).toBeGreaterThan(0)
  expect(versoes.versoes.p1).toHaveLength(1)
  expect(processos.chamadas).toEqual([])
})

test('a janela da técnica pede a versão e o relatório juntos, e o processo se move depois', async () => {
  const { processos, versoes } = montarVerso('relatorio_modelagem_tecnica', { ...NADA, versaoPiloto: true })
  await irPara('e4')
  const aberta = await janela(FRASE_DA_TECNICA)
  expect(aberta.getByRole('form', { name: 'Enviar versão' })).toBeTruthy()
  fireEvent.change(aberta.getByLabelText('Fluxograma Bizagi (.bpm)'), { target: { files: [BPM_VALIDO] } })
  await waitFor(() => expect(aberta.queryByText(/Será gravado como: .*\.bpm/)).toBeTruthy())
  expect(botaoDeEnviar(aberta).disabled).toBe(true)
  await enviar(aberta, ['Relatório (.docx)', DOCX])
  await waitFor(() => expect(processos.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e4' }]))
  expect(versoes.envios[0].arquivos.map((arquivo) => arquivo.papel)).toEqual(['bpm', 'relatorio'])
})

test('só falta o relatório: a janela mostra só o envio do relatório', async () => {
  const { processos } = montarVerso('relatorio_modelagem_tecnica', { ...NADA, versaoEmSequencia: true }, {
    ajustarVersoes: (versoes) => { versoes.versoes.p1 = [versaoDeTeste(8)] },
  })
  await irPara('e4')
  const aberta = await janela('Para sair da Relatório e modelagem técnica, envie o relatório.')
  expect(aberta.getByRole('form', { name: 'Enviar relatório' })).toBeTruthy()
  await enviar(aberta, ['Relatório (.docx)', DOCX])
  await waitFor(() => expect(processos.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e4' }]))
})

test('passando pelas duas etapas, uma janela de cada vez, e a chegada a Concluídos por último', async () => {
  const { processos } = montarVerso('nao_iniciados', NADA)
  await irPara('e8')
  await enviar(await janela(FRASE_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  const tecnica = await janela(FRASE_DA_TECNICA)
  expect(processos.chamadas).toEqual([])
  escolher(tecnica, 'Fluxograma Bizagi (.bpm)', BPM_VALIDO)
  await waitFor(() => expect(tecnica.queryByText(/Será gravado como: .*\.bpm/)).toBeTruthy())
  await enviar(tecnica, ['Relatório (.docx)', DOCX])
  const chegada = await janela('Levar Emitir Ofício a Concluídos')
  expect(processos.chamadas).toEqual([])
  fireEvent.click(chegada.getByRole('radio', { name: 'Concluir sem publicação' }))
  fireEvent.change(chegada.getByLabelText('Explicação'), { target: { value: 'Não será divulgado' } })
  fireEvent.click(chegada.getByRole('button', { name: 'Levar a Concluídos' }))
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(processos.chamadas[0]).toMatchObject({ acao: 'mover', id: 'p1', etapaId: 'e8' })
})

test('voltar e o processo que já estava adiante andam sem janela', async () => {
  const { processos } = montarVerso('relatorio_modelagem_tecnica', NADA)
  await irPara('e2')
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(screen.queryByRole('dialog', { name: /^Para sair/ })).toBeNull()
  cleanup()
  const adiante = montarVerso('revisao_interna', NADA)
  await irPara('e5')
  await waitFor(() => expect(adiante.processos.chamadas).toEqual([{ acao: 'mover', id: 'p1', etapaId: 'e5' }]))
})

test('ao arrastar o cartão, a trava também abre a janela e o processo não se move', async () => {
  window.location.hash = '#/processos'
  const emitir = processo('Emitir Ofício', { etapa: 'modelagem', processo: { arquivos: NADA } })
  const versoes = new VersoesFalso()
  versoes.processos[emitir.id] = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Modelagem piloto' }
  const falso = montar([emitir], 'integrante_ep', [], versoes)
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  const alvo = screen.getByRole('region', { name: ETAPAS.find((etapa) => etapa.codigo === 'relatorio_modelagem_tecnica')?.nome })
  fireEvent.dragOver(alvo, { dataTransfer })
  fireEvent.drop(alvo, { dataTransfer })
  const aberta = await janela(FRASE_DA_PILOTO)
  expect(aberta.getByRole('form', { name: 'Enviar versão piloto' })).toBeTruthy()
  expect(falso.chamadas).toEqual([])
  await enviar(aberta, ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  await waitFor(() => expect(falso.chamadas).toEqual([{ acao: 'mover', id: emitir.id, etapaId: 'e3' }]))
})
