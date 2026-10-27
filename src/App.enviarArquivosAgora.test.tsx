import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { cartaoDe, ETAPAS, montar, processo } from './testes/quadroDeTeste'
import { irPara, janela, montarVerso, NADA } from './testes/versoComArquivos'
import { BPM_VALIDO, versaoDeTeste } from './testes/versoesDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

// [Enviar arquivos agora] da Confirmação de arquivos (ticket 02 de travas-em-avisos, ADR 0028; histórias 139, 140, 148 e 149):
// a pergunta abre o envio da primeira etapa que falta; depois do envio, volta só com o que sobrou ou o processo se move.

const DOCX = new File(['relatorio'], 'relatorio.docx')
const TITULO_DA_PILOTO = 'Faltam os arquivos da Modelagem piloto.'
const TITULO_DA_TECNICA = 'Faltam os arquivos da Modelagem técnica.'
const ENVIO_DA_PILOTO = 'Enviar os arquivos da Modelagem piloto'
const ENVIO_DA_TECNICA = 'Enviar os arquivos da Modelagem técnica'
const AVISO_DO_MOVIMENTO = 'Os arquivos foram enviados, mas o processo não foi movido.'
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const botaoDeEnviar = (aberta: ReturnType<typeof within>) => aberta.getByRole('button', { name: 'Enviar e continuar' }) as HTMLButtonElement
const escolher = (aberta: ReturnType<typeof within>, rotulo: string, arquivo: File) =>
  fireEvent.change(aberta.getByLabelText(rotulo), { target: { files: [arquivo] } })
const enviarAgora = (aberta: ReturnType<typeof within>) => fireEvent.click(aberta.getByRole('button', { name: 'Enviar arquivos agora' }))

async function enviar(aberta: ReturnType<typeof within>, ...escolhas: [string, File][]) {
  for (const [rotulo, arquivo] of escolhas) escolher(aberta, rotulo, arquivo)
  await waitFor(() => expect(botaoDeEnviar(aberta).disabled).toBe(false))
  fireEvent.click(botaoDeEnviar(aberta))
}

test('[Enviar arquivos agora] é o botão principal e abre o envio da etapa que falta, sem mover nada', async () => {
  const { processos } = montarVerso('modelagem', NADA)
  await irPara('e3')
  const pergunta = await janela(TITULO_DA_PILOTO)
  expect(pergunta.getByRole('button', { name: 'Enviar arquivos agora' }).className).toContain('botao-principal')
  enviarAgora(pergunta)
  const envio = await janela(ENVIO_DA_PILOTO)
  expect(envio.getByRole('form', { name: 'Enviar versão piloto' })).toBeTruthy()
  expect(botaoDeEnviar(envio).disabled).toBe(true)
  expect(screen.queryByRole('dialog', { name: TITULO_DA_PILOTO })).toBeNull()
  expect(processos.chamadas).toEqual([])
})

test('enviar a piloto move o processo', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA)
  await irPara('e3')
  enviarAgora(await janela(TITULO_DA_PILOTO))
  await enviar(await janela(ENVIO_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(processos.chamadas[0]).toMatchObject({ acao: 'mover', id: 'p1', etapaId: 'e3' })
  expect(versoes.versoes.p1).toHaveLength(1)
  expect(versoes.versoes.p1[0].piloto).toBe(true)
  expect(screen.queryByRole('dialog', { name: ENVIO_DA_PILOTO })).toBeNull()
})

test('a técnica pede a versão e o relatório juntos, e o processo se move depois', async () => {
  const { processos, versoes } = montarVerso('relatorio_modelagem_tecnica', { ...NADA, versaoPiloto: true })
  await irPara('e4')
  enviarAgora(await janela(TITULO_DA_TECNICA))
  const envio = await janela(ENVIO_DA_TECNICA)
  expect(envio.getByRole('form', { name: 'Enviar versão' })).toBeTruthy()
  escolher(envio, 'Fluxograma Bizagi (.bpm)', BPM_VALIDO)
  await waitFor(() => expect(envio.queryByText(/Será gravado como: .*\.bpm/)).toBeTruthy())
  expect(botaoDeEnviar(envio).disabled).toBe(true)
  await enviar(envio, ['Relatório (.docx)', DOCX])
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
  expect(versoes.envios[0].arquivos.map((arquivo) => arquivo.papel)).toEqual(['bpm', 'relatorio'])
})

test('só falta o relatório: o envio mostra só o relatório', async () => {
  const { processos } = montarVerso('relatorio_modelagem_tecnica', { ...NADA, versaoEmSequencia: true }, {
    ajustarVersoes: (versoes) => { versoes.versoes.p1 = [versaoDeTeste(8)] },
  })
  await irPara('e4')
  enviarAgora(await janela(TITULO_DA_TECNICA))
  const envio = await janela(ENVIO_DA_TECNICA)
  expect(envio.getByRole('form', { name: 'Enviar relatório' })).toBeTruthy()
  await enviar(envio, ['Relatório (.docx)', DOCX])
  await waitFor(() => expect(processos.chamadas).toHaveLength(1))
})

test('passando pelas duas etapas, o envio de uma parte faz a pergunta voltar só com o que sobrou', async () => {
  const { processos } = montarVerso('nao_iniciados', NADA)
  await irPara('e5')
  enviarAgora(await janela('Faltam os arquivos de duas etapas.'))
  await enviar(await janela(ENVIO_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  const sobrou = await janela(TITULO_DA_TECNICA)
  expect(sobrou.getByText(/ainda não tem o fluxograma nem o relatório desta etapa/)).toBeTruthy()
  expect(screen.queryByRole('dialog', { name: 'Faltam os arquivos de duas etapas.' })).toBeNull()
  expect(processos.chamadas).toEqual([])
})

test('com destino Concluídos, a chegada vem depois do envio completo', async () => {
  const { processos } = montarVerso('nao_iniciados', NADA)
  await irPara('e8')
  enviarAgora(await janela('Faltam os arquivos de duas etapas.'))
  await enviar(await janela(ENVIO_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  enviarAgora(await janela(TITULO_DA_TECNICA))
  const tecnica = await janela(ENVIO_DA_TECNICA)
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

test('falha no envio: nada se move, a janela fica aberta e o arquivo continua escolhido', async () => {
  const { processos } = montarVerso('modelagem', NADA, { ajustarVersoes: (versoes) => { versoes.falharNoArquivo = 1 } })
  await irPara('e3')
  enviarAgora(await janela(TITULO_DA_PILOTO))
  const envio = await janela(ENVIO_DA_PILOTO)
  await enviar(envio, ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  expect((await envio.findByRole('alert')).textContent).toContain('não chegou ao Drive')
  expect(processos.chamadas).toEqual([])
  expect(envio.getByText(/fluxo\.bpm/)).toBeTruthy()
})

test('falha no movimento depois do envio avisa que os arquivos foram enviados', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA, { ajustarProcessos: (falso) => { falso.falhaDeGravacao = 'conexão perdida' } })
  await irPara('e3')
  enviarAgora(await janela(TITULO_DA_PILOTO))
  await enviar(await janela(ENVIO_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  expect((await screen.findAllByText(AVISO_DO_MOVIMENTO)).length).toBeGreaterThan(0)
  expect(versoes.versoes.p1).toHaveLength(1)
  expect(processos.chamadas).toEqual([])
})

test('[Cancelar] no envio deixa o processo onde estava', async () => {
  const { processos, versoes } = montarVerso('modelagem', NADA)
  await irPara('e3')
  enviarAgora(await janela(TITULO_DA_PILOTO))
  fireEvent.click((await janela(ENVIO_DA_PILOTO)).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: ENVIO_DA_PILOTO })).toBeNull())
  expect(processos.chamadas).toEqual([])
  expect(versoes.versoes.p1 ?? []).toEqual([])
})

test('ao arrastar o cartão, [Enviar arquivos agora] também envia e move', async () => {
  window.location.hash = '#/processos'
  const emitir = processo('Emitir Ofício', { etapa: 'modelagem', processo: { arquivos: NADA } })
  const versoes = new VersoesFalso()
  versoes.processos[emitir.id] = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Modelagem piloto' }
  const falso = montar([emitir], 'integrante_ep', [], versoes)
  fireEvent.dragStart(await cartaoDe('Emitir Ofício'), { dataTransfer })
  const alvo = screen.getByRole('region', { name: ETAPAS.find((etapa) => etapa.codigo === 'relatorio_modelagem_tecnica')?.nome })
  fireEvent.dragOver(alvo, { dataTransfer })
  fireEvent.drop(alvo, { dataTransfer })
  enviarAgora(await janela(TITULO_DA_PILOTO))
  expect(falso.chamadas).toEqual([])
  await enviar(await janela(ENVIO_DA_PILOTO), ['Fluxograma Bizagi (.bpm)', BPM_VALIDO])
  await waitFor(() => expect(falso.chamadas).toHaveLength(1))
  expect(falso.chamadas[0]).toMatchObject({ acao: 'mover', id: emitir.id, etapaId: 'e3' })
})
