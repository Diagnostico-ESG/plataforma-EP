import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { etapaAtualDe } from './testes/processoDaLista'
import { type Montagem, montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { BPM_VALIDO, PNG_VALIDO, arquivoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import { escolherNoMenuDoProcesso } from './testes/versoDoCartao'
import type { VersoesFalso } from './versoes/VersoesFalso'
import type { Versao } from './versoes/tipos'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BOTOES = ['Registrar versão histórica', 'Enviar versão piloto', 'Enviar versão']
const BPM = 'Fluxograma Bizagi (.bpm)'

const historica = (numero: number): Versao => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})
const piloto = (numero: number): Versao => versaoDeTeste(numero, {
  piloto: true, arquivos: [arquivoDeTeste(numero, 'bpm', 'bpm')],
})

const comVersoes = (etapa: string, versoes: Versao[], mais: Montagem = {}): Montagem => ({
  ...mais,
  ajustarProcessos: naEtapa(etapa),
  ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = versoes },
})

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

const botoesDeEnvio = (secao: Awaited<ReturnType<typeof secaoDeVersoes>>) =>
  BOTOES.filter((nome) => secao.queryByRole('button', { name: nome }))

test.each([
  ['nao_iniciados', 'Registrar versão histórica'],
  ['modelagem', 'Enviar versão piloto'],
  ['relatorio_modelagem_tecnica', 'Enviar versão'],
  ['revisao_interna', 'Enviar versão'],
  ['revisao_setor', null],
  ['aprovacao_setor', null],
  ['publicacao', null],
  ['concluidos', null],
])('na etapa %s o verso oferece só o envio da etapa: %s', async (etapa, botao) => {
  montarNosCadastros(comVersoes(etapa, []))
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(botoesDeEnvio(secao)).toEqual(botao ? [botao] : [])
})

test('numa etapa nova do catálogo não há envio de versão', async () => {
  montarNosCadastros({
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) =>
        processo.id === 'p1' ? { ...processo, etapaAtual: { ...etapaAtualDe('publicacao'), codigo: 'etapa_nova' } } : processo)
    },
  })
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(botoesDeEnvio(secao)).toEqual([])
})

test('nas etapas sem envio a lista de versões continua aparecendo, sem espaço vazio no lugar dos botões', async () => {
  montarNosCadastros(comVersoes('publicacao', [versaoDeTeste(1)]))
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V1' })
  expect(botoesDeEnvio(secao)).toEqual([])
  expect(secao.queryByRole('button', { name: 'Mais ações dos arquivos' })).toBeNull()
})

test('depois da primeira versão em sequência, a Modelagem piloto não oferece mais a versão piloto', async () => {
  montarNosCadastros(comVersoes('modelagem', [piloto(6), versaoDeTeste(7)]))
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V7' })
  expect(botoesDeEnvio(secao)).toEqual([])
})

test.each([
  ['a Consulta', { perfil: 'consulta' as const }],
  ['o processo suspenso', {
    ajustarProcessos: (falso: Parameters<NonNullable<Montagem['ajustarProcessos']>>[0]) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao: 'suspenso' as const } : processo))
    },
  }],
])('%s não vê o botão da versão piloto', async (_quem, mais) => {
  const { ajustarProcessos, ...resto } = mais as Montagem
  montarNosCadastros({
    ...resto,
    ajustarProcessos: (falso) => {
      naEtapa('modelagem')(falso)
      ajustarProcessos?.(falso)
    },
  })
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(botoesDeEnvio(secao)).toEqual([])
})

async function abrirFormularioDaPiloto() {
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão piloto' }))
  return { secao, form: within(await secao.findByRole('form', { name: 'Enviar versão piloto' })) }
}

type Form = Awaited<ReturnType<typeof abrirFormularioDaPiloto>>['form']

const botaoEnviar = (form: Form) => form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
const numero = (form: Form) => form.getByLabelText('Número da versão') as HTMLInputElement
const escolher = (form: Form, rotulo: string, arquivo: File) => fireEvent.change(form.getByLabelText(rotulo), { target: { files: [arquivo] } })

test('o número da piloto vem preenchido com o menor aceito: depois da V5F é 6; sem versão, 1', async () => {
  montarNosCadastros(comVersoes('modelagem', [historica(5)]))
  const { form } = await abrirFormularioDaPiloto()
  expect(numero(form).value).toBe('6')
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V6P.')
  cleanup()
  montarNosCadastros(comVersoes('modelagem', []))
  expect(numero((await abrirFormularioDaPiloto()).form).value).toBe('1')
})

test('só o .bpm é exigido; o .png e o .bpmn são opcionais; os nomes têm o P', async () => {
  montarNosCadastros(comVersoes('modelagem', [historica(5)]))
  const { form } = await abrirFormularioDaPiloto()
  expect(botaoEnviar(form).disabled).toBe(true)
  escolher(form, BPM, BPM_VALIDO)
  expect(await form.findByText('Será gravado como: TSA_V6P_Emitir Ofício.bpm')).toBeTruthy()
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  expect(form.getByLabelText('Imagem do fluxo (.png) (opcional)')).toBeTruthy()
  expect(form.getByLabelText('.bpmn (opcional)')).toBeTruthy()
})

test('trocar o número muda o rótulo e o nome; número que não é número não habilita o envio', async () => {
  montarNosCadastros(comVersoes('modelagem', [historica(5)]))
  const { form } = await abrirFormularioDaPiloto()
  escolher(form, BPM, BPM_VALIDO)
  fireEvent.change(numero(form), { target: { value: '9' } })
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V9P.')
  expect(await form.findByText('Será gravado como: TSA_V9P_Emitir Ofício.bpm')).toBeTruthy()
  fireEvent.change(numero(form), { target: { value: 'abc' } })
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(true))
  expect(form.getByText('Digite um número inteiro maior que zero.')).toBeTruthy()
})

test('enviar registra a V6P com o número digitado e o P, fecha o formulário e o botão continua para a próxima', async () => {
  const { versoes } = montarNosCadastros(comVersoes('modelagem', [historica(5)]))
  const { secao, form } = await abrirFormularioDaPiloto()
  escolher(form, BPM, BPM_VALIDO)
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
  const v6p = within(await secao.findByRole('article', { name: 'V6P' }))
  expect(v6p.getByText('Piloto')).toBeTruthy()
  expect(v6p.getByRole('link', { name: (nome) => nome.includes('TSA_V6P_Emitir Ofício.bpm') })).toBeTruthy()
  expect(secao.queryByRole('form', { name: 'Enviar versão piloto' })).toBeNull()
  expect(versoes.envios[0]).toMatchObject({ processoId: 'p1', numero: 6, piloto: true })
  fireEvent.click(secao.getByRole('button', { name: 'Enviar versão piloto' }))
  expect((await secao.findByLabelText('Número da versão') as HTMLInputElement).value).toBe('7')
})

test('número que não é maior que o das versões: a recusa aparece com o mínimo e o formulário continua preenchido', async () => {
  montarNosCadastros(comVersoes('modelagem', [historica(5)]))
  const { form } = await abrirFormularioDaPiloto()
  escolher(form, BPM, BPM_VALIDO)
  fireEvent.change(numero(form), { target: { value: '5' } })
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
  const alerta = await form.findByRole('alert')
  expect(alerta.textContent).toBe('O número da versão piloto precisa ser maior que 5.')
  expect(numero(form).value).toBe('5')
  expect(form.getByText('Será gravado como: TSA_V5P_Emitir Ofício.bpm')).toBeTruthy()
})

test('sem versão, a piloto começa de qualquer número a partir de 1, e duas pilotos seguidas são aceitas', async () => {
  montarNosCadastros(comVersoes('modelagem', []))
  const { secao, form } = await abrirFormularioDaPiloto()
  escolher(form, BPM, BPM_VALIDO)
  fireEvent.change(numero(form), { target: { value: '3' } })
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
  await secao.findByRole('article', { name: 'V3P' })
  fireEvent.click(secao.getByRole('button', { name: 'Enviar versão piloto' }))
  const segundo = within(await secao.findByRole('form', { name: 'Enviar versão piloto' }))
  escolher(segundo, BPM, BPM_VALIDO)
  await waitFor(() => expect(botaoEnviar(segundo).disabled).toBe(false))
  fireEvent.click(botaoEnviar(segundo))
  await secao.findByRole('article', { name: 'V4P' })
  expect(secao.getAllByRole('article', { name: /^V\d/ }).map((item) => item.getAttribute('aria-label'))).toEqual(['V4P', 'V3P'])
})

test('a versão em sequência continua do maior número, de qualquer tipo: depois da V6P, é a V7, só com o .bpm', async () => {
  const { versoes } = montarNosCadastros(comVersoes('relatorio_modelagem_tecnica', [piloto(6)]))
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar versão' }))
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V7.')
  escolher(form, BPM, BPM_VALIDO)
  await waitFor(() => expect((form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(form.getByRole('button', { name: 'Enviar' }))
  await secao.findByRole('article', { name: 'V7' })
  expect(versoes.envios[0].arquivos.map((arquivo) => arquivo.papel)).toEqual(['bpm'])
})

test('o botão abre e fecha o formulário, que rola até aparecer inteiro', async () => {
  const rolar = vi.fn()
  Element.prototype.scrollIntoView = rolar
  montarNosCadastros(comVersoes('modelagem', []))
  const secao = await secaoDeVersoes()
  const botao = await secao.findByRole('button', { name: 'Enviar versão piloto' })
  fireEvent.click(botao)
  await secao.findByRole('form', { name: 'Enviar versão piloto' })
  expect(rolar).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' })
  expect(botao.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(botao)
  expect(secao.queryByRole('form', { name: 'Enviar versão piloto' })).toBeNull()
})

test('a versão piloto enviada aparece no histórico com texto próprio e o rótulo V6P', async () => {
  montarNosCadastros(comVersoes('modelagem', [historica(5)]))
  const { form } = await abrirFormularioDaPiloto()
  escolher(form, BPM, BPM_VALIDO)
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
  await escolherNoMenuDoProcesso('Histórico')
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  const evento = await painel.findByText('Enviou a versão piloto')
  expect(evento.parentElement?.textContent).toBe('Enviou a versão piloto V6P — Emitir Ofício')
  expect(painel.getByText(/Arquivos: TSA_V6P_Emitir Ofício.bpm/)).toBeTruthy()
})

test('a piloto sem o .bpm não existe como pedido: só o .png ou só o .bpmn não habilitam o envio', async () => {
  montarNosCadastros(comVersoes('modelagem', []))
  const { form } = await abrirFormularioDaPiloto()
  escolher(form, 'Imagem do fluxo (.png) (opcional)', PNG_VALIDO)
  expect(await form.findByText('Será gravado como: TSA_V1P_Emitir Ofício.png')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(true)
})
