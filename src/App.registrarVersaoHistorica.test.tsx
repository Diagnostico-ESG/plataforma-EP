import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { SituacaoDoProcesso } from './processos/tipos'
import { montarNosCadastros } from './testes/reunioesNosCadastros'
import { BPMN_VALIDO, PNG_VALIDO, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BPM = new File(['bizagi'], 'fonte.bpm')

/** Uma versão histórica de teste (V{n}F): sem etapa, só com o .bpm. */
const historicaDeTeste = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})

const comHistoricas = (...numeros: number[]) => ({
  ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = numeros.map(historicaDeTeste) },
})

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  return within(await painel.findByRole('region', { name: 'Versões do processo' }))
}

const BOTAO = 'Registrar versão histórica'

async function abrirFormulario() {
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: BOTAO }))
  return { secao, form: within(await secao.findByRole('form', { name: BOTAO })) }
}

type Form = Awaited<ReturnType<typeof abrirFormulario>>['form']

const botaoRegistrar = (form: Form) => form.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement
const digitarNumero = (form: Form, texto: string) => fireEvent.change(form.getByLabelText('Número da versão'), { target: { value: texto } })
const escolher = (form: Form, rotulo: string, arquivo: File) => fireEvent.change(form.getByLabelText(rotulo), { target: { files: [arquivo] } })
const escolherBpm = (form: Form) => escolher(form, 'Arquivo do Bizagi (.bpm) (opcional)', BPM)

async function preencherNumeroEBpm(form: Form, numero: string) {
  digitarNumero(form, numero)
  escolherBpm(form)
  await waitFor(() => expect(botaoRegistrar(form).disabled).toBe(false))
}

test.each(['administrador', 'integrante_ep'] as const)('o %s vê [Registrar versão histórica] no processo sem versão', async (perfil) => {
  montarNosCadastros({ perfil })
  expect(await (await secaoDeVersoes()).findByRole('button', { name: BOTAO })).toBeTruthy()
})

test('com só versões históricas, o botão continua aparecendo', async () => {
  montarNosCadastros(comHistoricas(3, 4))
  expect(await (await secaoDeVersoes()).findByRole('button', { name: BOTAO })).toBeTruthy()
})

test('com versão nova, o botão não aparece', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => { falso.versoes.p1 = [historicaDeTeste(5), versaoDeTeste(6)] } })
  const secao = await secaoDeVersoes()
  await secao.findByRole('listitem', { name: 'V6' })
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('a Consulta não vê o botão', async () => {
  montarNosCadastros({ perfil: 'consulta' })
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s não mostra o botão', async (situacao: SituacaoDoProcesso) => {
  montarNosCadastros({
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  })
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('o formulário tem o número, os quatro campos de arquivo e a observação, e começa sem poder registrar', async () => {
  montarNosCadastros()
  const { form } = await abrirFormulario()
  expect((form.getByLabelText('Número da versão') as HTMLInputElement).value).toBe('')
  for (const rotulo of ['Fluxograma (.bpmn) (opcional)', 'Imagem do fluxograma (.png) (opcional)', 'Arquivo do Bizagi (.bpm) (opcional)',
    'Relatório (.docx ou .pdf) (opcional)']) {
    expect((form.getByLabelText(rotulo) as HTMLInputElement).type).toBe('file')
  }
  expect((form.getByLabelText('Observação (opcional)') as HTMLTextAreaElement).maxLength).toBe(2000)
  expect(form.getByText('Informe o .bpm, ou o .bpmn com o .png.')).toBeTruthy()
  expect(botaoRegistrar(form).disabled).toBe(true)
})

test.each(['', '0', '5.5', 'abc', '-3'])('o número "%s" não habilita o botão', async (texto) => {
  montarNosCadastros()
  const { form } = await abrirFormulario()
  escolherBpm(form)
  digitarNumero(form, texto)
  await waitFor(() => expect(form.getByLabelText('Arquivo do Bizagi (.bpm) (opcional)')).toBeTruthy())
  expect(botaoRegistrar(form).disabled).toBe(true)
  if (texto) expect(form.getByText('Digite um número inteiro maior que zero.')).toBeTruthy()
})

test('basta o .bpm; só o .bpmn ou só o .png não bastam; o par basta, com relatório opcional', async () => {
  montarNosCadastros()
  const { form } = await abrirFormulario()
  digitarNumero(form, '5')
  escolher(form, 'Fluxograma (.bpmn) (opcional)', BPMN_VALIDO)
  expect(await form.findByText('Será gravado como: TSA_V5F_Emitir Ofício.bpmn')).toBeTruthy()
  expect(botaoRegistrar(form).disabled).toBe(true)
  escolher(form, 'Imagem do fluxograma (.png) (opcional)', PNG_VALIDO)
  await waitFor(() => expect(botaoRegistrar(form).disabled).toBe(false))
  escolher(form, 'Relatório (.docx ou .pdf) (opcional)', new File(['r'], 'relatorio.docx'))
  expect(await form.findByText('Será gravado como: TSA_V5F_Emitir Ofício_Relatório.docx')).toBeTruthy()
  expect(botaoRegistrar(form).disabled).toBe(false)
})

test('a prévia diz o rótulo V5F e o nome do arquivo com o F', async () => {
  montarNosCadastros()
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '5')
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V5F.')
  expect(form.getByText('Será gravado como: TSA_V5F_Emitir Ofício.bpm')).toBeTruthy()
})

test('registrar a V5F fecha o formulário e a lista mostra a V5F, sem etapa, como somente leitura', async () => {
  const { versoes } = montarNosCadastros()
  const { secao, form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '5')
  fireEvent.click(botaoRegistrar(form))
  const v5f = within(await secao.findByRole('listitem', { name: 'V5F' }))
  expect(v5f.getByText('Histórica · somente leitura')).toBeTruthy()
  expect(v5f.queryByText('Reunião de modelagem')).toBeNull()
  expect(v5f.getByText('TSA_V5F_Emitir Ofício.bpm')).toBeTruthy()
  expect(v5f.queryByRole('button')).toBeNull()
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(versoes.envios[0]).toMatchObject({ processoId: 'p1', numero: 5 })
})

test('registra várias históricas, da mais recente para a mais antiga, e o botão continua', async () => {
  montarNosCadastros()
  const { secao, form: primeiro } = await abrirFormulario()
  await preencherNumeroEBpm(primeiro, '3')
  fireEvent.click(botaoRegistrar(primeiro))
  await secao.findByRole('listitem', { name: 'V3F' })
  fireEvent.click(secao.getByRole('button', { name: BOTAO }))
  const segundo = within(await secao.findByRole('form', { name: BOTAO }))
  await preencherNumeroEBpm(segundo, '4')
  fireEvent.click(botaoRegistrar(segundo))
  await secao.findByRole('listitem', { name: 'V4F' })
  expect(secao.getAllByRole('listitem', { name: /^V\d/ }).map((item) => item.getAttribute('aria-label'))).toEqual(['V4F', 'V3F'])
  expect(secao.getByRole('button', { name: BOTAO })).toBeTruthy()
})

test('a primeira versão nova continua a numeração (V5F → V6) e o botão da histórica some', async () => {
  montarNosCadastros(comHistoricas(5))
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar versão' }))
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V6.')
  fireEvent.change(form.getByLabelText('Fluxograma (.bpmn)'), { target: { files: [BPMN_VALIDO] } })
  fireEvent.change(form.getByLabelText('Imagem do fluxograma (.png)'), { target: { files: [PNG_VALIDO] } })
  const enviar = form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
  await waitFor(() => expect(enviar.disabled).toBe(false))
  fireEvent.click(enviar)
  await secao.findByRole('listitem', { name: 'V6' })
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
  expect(secao.getByRole('listitem', { name: 'V5F' })).toBeTruthy()
})

test('número de histórica repetido: a recusa aparece em vermelho e o formulário continua preenchido', async () => {
  montarNosCadastros(comHistoricas(5))
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '5')
  fireEvent.click(botaoRegistrar(form))
  const alerta = await form.findByRole('alert')
  expect(alerta.textContent).toBe('O processo já tem a versão histórica V5F. Use outro número.')
  expect(alerta.className).toContain('cadastros-falha')
  expect((form.getByLabelText('Número da versão') as HTMLInputElement).value).toBe('5')
  expect(form.getByText('Será gravado como: TSA_V5F_Emitir Ofício.bpm')).toBeTruthy()
})

test('a recusa do banco (histórica depois de versão nova) aparece com a frase pronta', async () => {
  montarNosCadastros({
    ajustarVersoes: (falso) => {
      falso.falhaNoRegistro = new TravaDoBanco('O processo já tem versão nova; versões históricas só podem ser registradas antes dela.')
    },
  })
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '2')
  fireEvent.click(botaoRegistrar(form))
  expect((await form.findByRole('alert')).textContent)
    .toBe('O processo já tem versão nova; versões históricas só podem ser registradas antes dela.')
})

test('falha sem recusa: a mensagem diz que a versão não foi registrada e que os arquivos continuam', async () => {
  const { versoes } = montarNosCadastros({ ajustarVersoes: (falso) => { falso.falharNoArquivo = 1 } })
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '2')
  fireEvent.click(botaoRegistrar(form))
  expect((await form.findByRole('alert')).textContent).toBe(
    'A versão não foi registrada: o arquivo fonte.bpm não chegou ao Drive. Os arquivos escolhidos continuam no formulário.')
  expect(versoes.envios).toEqual([])
})

test('durante o registro, o progresso aparece e os campos ficam travados', async () => {
  montarNosCadastros({ ajustarVersoes: (falso) => { falso.segurarDepoisDe = 1 } })
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '2')
  fireEvent.click(botaoRegistrar(form))
  expect((await form.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  expect(form.getByLabelText('Número da versão').matches(':disabled')).toBe(true)
  expect(botaoRegistrar(form).disabled).toBe(true)
})

test('[Cancelar] fecha o formulário da histórica sem registrar', async () => {
  const { versoes } = montarNosCadastros()
  const { secao, form } = await abrirFormulario()
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(versoes.envios).toEqual([])
})
