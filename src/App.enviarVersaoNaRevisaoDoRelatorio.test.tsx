import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { BPM_VALIDO, PNG_VALIDO, relatorioNumeradoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// Na Revisão do relatório (ADR 0046) o [Enviar versão] pede o relatório; o .bpm é opcional e o .png só vai com o .bpm. O
// processo p1 tem a V1 e a V2, esta com o Relatório R1.
const noProcesso = (codigoDaEtapa: string) => ({
  ajustarProcessos: naEtapa(codigoDaEtapa),
  ajustarVersoes: (falso: VersoesFalso) => {
    falso.versoes.p1 = [versaoDeTeste(1), versaoDeTeste(2, { arquivos: [relatorioNumeradoDeTeste(2, 1)] })]
  },
})

async function secaoDosDocumentos() {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

async function abrirFormulario() {
  const secao = await secaoDosDocumentos()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  return { secao, form: within(await secao.findByRole('form', { name: 'Enviar versão' })) }
}

type Form = Awaited<ReturnType<typeof abrirFormulario>>['form']

function escolher(form: Form, rotulo: string, arquivo: File) {
  fireEvent.change(form.getByLabelText(rotulo), { target: { files: [arquivo] } })
}

const BPM = 'Fluxograma Bizagi (.bpm) (opcional)'
const PNG = 'Imagem do fluxo (.png) (opcional)'
const RELATORIO = 'Relatório (.docx)'
const RELATORIO_VALIDO = new File(['r'], 'relatorio.docx')
const botaoEnviar = (form: Form) => form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
const campo = (form: Form, rotulo: string) => form.getByLabelText(rotulo) as HTMLInputElement

test('o formulário diz que o relatório é obrigatório e o .bpm e o .png opcionais, e o .png fica desligado sem o .bpm', async () => {
  montarNosCadastros(noProcesso('revisao_relatorio'))
  const { form } = await abrirFormulario()
  expect(form.getByText('O relatório é obrigatório; o .bpm e o .png são opcionais. O .png só vai junto com o .bpm.')).toBeTruthy()
  expect(campo(form, PNG).disabled).toBe(true)
  escolher(form, BPM, BPM_VALIDO)
  await waitFor(() => expect(campo(form, PNG).disabled).toBe(false))
  expect(botaoEnviar(form).disabled).toBe(true)
})

test('só com o relatório nasce o Relatório R2 na versão mais recente, sem versão nova', async () => {
  const { versoes } = montarNosCadastros(noProcesso('revisao_relatorio'))
  const { secao, form } = await abrirFormulario()
  escolher(form, RELATORIO, RELATORIO_VALIDO)
  expect(await form.findByText('Relatório R2, acompanha a V2')).toBeTruthy()
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Enviar versão' })).toBeNull())
  expect(versoes.envios).toEqual([])
  expect(versoes.versoes.p1.find((versao) => versao.numero === 2)?.arquivos.map((arquivo) => arquivo.numeroDoRelatorio)).toEqual([1, 2])
})

test('com o relatório e o .bpm nasce a V3, com o relatório junto', async () => {
  const { versoes } = montarNosCadastros(noProcesso('revisao_relatorio'))
  const { secao, form } = await abrirFormulario()
  escolher(form, RELATORIO, RELATORIO_VALIDO)
  escolher(form, BPM, BPM_VALIDO)
  await waitFor(() => expect(campo(form, PNG).disabled).toBe(false))
  escolher(form, PNG, PNG_VALIDO)
  expect(await form.findByText('Esta versão será a', { exact: false })).toBeTruthy()
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Enviar versão' })).toBeNull())
  expect(versoes.envios[0]).toMatchObject({ processoId: 'p1', numero: 3, numeroDoRelatorio: 2 })
  expect(versoes.envios[0].arquivos.map((arquivo) => arquivo.papel)).toEqual(['bpm', 'png', 'relatorio'])
})

test('na Revisão do relatório não há [Enviar relatório]; na do fluxograma ele continua, com o .bpm obrigatório', async () => {
  montarNosCadastros(noProcesso('revisao_relatorio'))
  expect((await secaoDosDocumentos()).queryByRole('button', { name: 'Enviar relatório' })).toBeNull()
  cleanup()
  montarNosCadastros(noProcesso('revisao_interna'))
  const { secao, form } = await abrirFormulario()
  expect(secao.getByRole('button', { name: 'Enviar relatório' })).toBeTruthy()
  expect(form.getByLabelText('Fluxograma Bizagi (.bpm)')).toBeTruthy()
  expect(form.getByLabelText('Relatório (.docx) (opcional)')).toBeTruthy()
})
