import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { SituacaoDoProcesso } from './processos/tipos'
import { montarNosCadastros } from './testes/reunioesNosCadastros'
import { arquivoDeTeste, PNG_VALIDO, versaoDeTeste } from './testes/versoesDeTeste'
import { falhaDaFuncao } from './versoes/recusasDeVersoes'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const comRelatorio = (numero: number) => versaoDeTeste(numero, {
  arquivos: [arquivoDeTeste(numero, 'bpmn', 'bpmn'), arquivoDeTeste(numero, 'png', 'png'), arquivoDeTeste(numero, 'relatorio', 'pdf')],
})
const historicaDeTeste = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})

/** H2 (histórica), V3 com relatório, V4 só com o par. */
const COM_VERSOES = {
  ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = [historicaDeTeste(2), comRelatorio(3), versaoDeTeste(4)] },
}

const PNG_V3 = 'TSA_V3_Emitir Ofício.png'
const RELATORIO_V3 = 'TSA_V3_Emitir Ofício_Relatório.pdf'
const ROTULO_DO_PNG = 'Imagem do fluxograma (.png)'

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  return within(await painel.findByRole('region', { name: 'Versões do processo' }))
}

const botaoDaTroca = (nome: string) => ({ name: `Substituir ${nome}` })

async function abrirTroca(nome = PNG_V3, montagem: Parameters<typeof montarNosCadastros>[0] = COM_VERSOES) {
  const falso = montarNosCadastros(montagem)
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', botaoDaTroca(nome)))
  return { ...falso, secao, form: within(await secao.findByRole('form', { name: `Substituir ${nome}` })) }
}

type Form = Awaited<ReturnType<typeof abrirTroca>>['form']

const botaoSubstituir = (form: Form) => form.getByRole('button', { name: 'Substituir' }) as HTMLButtonElement
const escolher = (form: Form, rotulo: string, arquivo: File) =>
  fireEvent.change(form.getByLabelText(rotulo), { target: { files: [arquivo] } })
const tamanhoDoPngDaV3 = (versoes: VersoesFalso) =>
  versoes.versoes.p1.find((versao) => versao.id === 'v3')?.arquivos.find((arquivo) => arquivo.papel === 'png')?.tamanho

async function escolherEConfirmar(form: Form) {
  escolher(form, ROTULO_DO_PNG, PNG_VALIDO)
  await waitFor(() => expect(botaoSubstituir(form).disabled).toBe(false))
  fireEvent.click(botaoSubstituir(form))
  return within(screen.getByRole('dialog', { name: `Substituir ${PNG_V3}?` }))
}

test.each(['administrador', 'integrante_ep'] as const)('o %s vê [Substituir] em cada arquivo da versão nova', async (perfil) => {
  montarNosCadastros({ ...COM_VERSOES, perfil })
  const v3 = within(await (await secaoDeVersoes()).findByRole('listitem', { name: 'V3' }))
  for (const nome of [PNG_V3, 'TSA_V3_Emitir Ofício.bpmn', RELATORIO_V3]) {
    expect(v3.getByRole('button', botaoDaTroca(nome))).toBeTruthy()
  }
})

test('a versão histórica não tem [Substituir]', async () => {
  montarNosCadastros(COM_VERSOES)
  const secao = await secaoDeVersoes()
  const historica = within(await secao.findByRole('listitem', { name: 'V2F' }))
  expect(historica.queryByRole('button')).toBeNull()
})

test('a Consulta vê os links dos arquivos, sem [Substituir]', async () => {
  montarNosCadastros({ ...COM_VERSOES, perfil: 'consulta' })
  const secao = await secaoDeVersoes()
  expect(await secao.findByText(PNG_V3)).toBeTruthy()
  expect(secao.queryByRole('button')).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s não mostra [Substituir]', async (situacao: SituacaoDoProcesso) => {
  montarNosCadastros({
    ...COM_VERSOES,
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  })
  const secao = await secaoDeVersoes()
  expect(await secao.findByText(PNG_V3)).toBeTruthy()
  expect(secao.queryByRole('button', botaoDaTroca(PNG_V3))).toBeNull()
})

test('o formulário pede o arquivo do mesmo papel, com o nome que continua valendo, e só habilita com um arquivo que serve', async () => {
  const { form } = await abrirTroca()
  expect(botaoSubstituir(form).disabled).toBe(true)
  escolher(form, ROTULO_DO_PNG, PNG_VALIDO)
  expect(await form.findByText(`Será gravado como: ${PNG_V3}`)).toBeTruthy()
  await waitFor(() => expect(botaoSubstituir(form).disabled).toBe(false))
})

test('as conferências do envio valem na troca: um .png que não é imagem é recusado ao lado do campo', async () => {
  const { form } = await abrirTroca()
  escolher(form, ROTULO_DO_PNG, new File(['texto'], 'foto.png'))
  expect(await form.findByText('O arquivo não é uma imagem PNG.')).toBeTruthy()
  expect(botaoSubstituir(form).disabled).toBe(true)
})

test('o arquivo novo precisa ser do mesmo tipo: .docx no lugar do .pdf é recusado ao lado do campo', async () => {
  const { form } = await abrirTroca(RELATORIO_V3)
  escolher(form, 'Relatório (.docx ou .pdf)', new File(['relatorio'], 'novo.docx'))
  expect(await form.findByText('Escolha um arquivo .pdf, o mesmo tipo do arquivo que sai. Recebido: .docx.')).toBeTruthy()
  expect(botaoSubstituir(form).disabled).toBe(true)
  escolher(form, 'Relatório (.docx ou .pdf)', new File(['relatorio'], 'novo.pdf'))
  await waitFor(() => expect(botaoSubstituir(form).disabled).toBe(false))
})

test('Substituir pede confirmação e avisa que o arquivo anterior não fica guardado; Cancelar não envia nada', async () => {
  const { form, versoes } = await abrirTroca()
  const janela = await escolherEConfirmar(form)
  expect(janela.getByText(/arquivo anterior não fica guardado/)).toBeTruthy()
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(tamanhoDoPngDaV3(versoes)).toBe(100)
  expect(botaoSubstituir(form).disabled).toBe(false)
})

test('confirmar troca o arquivo no mesmo lugar: mesmo nome, sem versão nova, e o formulário fecha', async () => {
  const { secao, form, versoes } = await abrirTroca()
  fireEvent.click((await escolherEConfirmar(form)).getByRole('button', { name: 'Substituir' }))
  await waitFor(() => expect(secao.queryByRole('form', { name: `Substituir ${PNG_V3}` })).toBeNull())
  await waitFor(() => expect(tamanhoDoPngDaV3(versoes)).toBe(PNG_VALIDO.size))
  const v3 = within(secao.getByRole('listitem', { name: 'V3' }))
  expect(v3.getByText(PNG_V3)).toBeTruthy()
  expect(v3.getByRole('button', botaoDaTroca(PNG_V3))).toBeTruthy()
  expect(secao.getAllByRole('listitem', { name: /^V\d/ })).toHaveLength(3)
  expect(versoes.versoes.p1).toHaveLength(3)
})

test('o progresso aparece e o campo trava enquanto o arquivo vai ao Drive', async () => {
  const { form, versoes } = await abrirTroca()
  versoes.segurarDepoisDe = 1
  fireEvent.click((await escolherEConfirmar(form)).getByRole('button', { name: 'Substituir' }))
  expect((await form.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  expect(form.getByLabelText(ROTULO_DO_PNG).matches(':disabled')).toBe(true)
})

test('se o arquivo não chega ao Drive, nada é trocado e o formulário continua preenchido', async () => {
  const { form, versoes } = await abrirTroca()
  versoes.falharNoArquivo = 1
  fireEvent.click((await escolherEConfirmar(form)).getByRole('button', { name: 'Substituir' }))
  expect((await form.findByRole('alert')).textContent)
    .toBe('A troca não foi registrada: o arquivo fluxo.png não chegou ao Drive. O arquivo escolhido continua no formulário.')
  expect(tamanhoDoPngDaV3(versoes)).toBe(100)
  expect(botaoSubstituir(form).disabled).toBe(false)
})

test('a recusa do servidor vira a frase da tela, com o formulário preenchido', async () => {
  const { form, versoes } = await abrirTroca()
  versoes.falhaNoRegistro = falhaDaFuncao('processo_fora_de_andamento', 'suspenso')
  fireEvent.click((await escolherEConfirmar(form)).getByRole('button', { name: 'Substituir' }))
  expect((await form.findByRole('alert')).textContent).toBe('O processo não está em andamento; não é possível enviar versão.')
  expect(tamanhoDoPngDaV3(versoes)).toBe(100)
  expect(botaoSubstituir(form).disabled).toBe(false)
})

test('Cancelar fecha o formulário sem enviar nada', async () => {
  const { secao, form, versoes } = await abrirTroca()
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: `Substituir ${PNG_V3}` })).toBeNull()
  expect(secao.getByRole('button', botaoDaTroca(PNG_V3))).toBeTruthy()
  expect(tamanhoDoPngDaV3(versoes)).toBe(100)
})

test('a troca entra no histórico do processo com o nome e o hash do que saiu', async () => {
  const { secao, form } = await abrirTroca()
  fireEvent.click((await escolherEConfirmar(form)).getByRole('button', { name: 'Substituir' }))
  await waitFor(() => expect(secao.queryByRole('form', { name: `Substituir ${PNG_V3}` })).toBeNull())
  const painel = within(screen.getByRole('complementary', { name: 'Painel do processo' }))
  fireEvent.click(painel.getByRole('tab', { name: 'Histórico' }))
  const troca = await painel.findByText('Substituiu o arquivo da versão')
  expect(troca.parentElement?.textContent).toBe('Substituiu o arquivo da versão V3 — Emitir Ofício')
  expect(painel.getByText(/Nome: TSA_V3_Emitir Ofício.png; Impressão digital \(MD5\): hash-a3-png-0/)).toBeTruthy()
  expect(painel.getByText(/Impressão digital \(MD5\): hash-a3-png-1/)).toBeTruthy()
})
