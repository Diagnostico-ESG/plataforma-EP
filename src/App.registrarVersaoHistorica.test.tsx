import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { SituacaoDoProcesso } from './processos/tipos'
import { type Montagem, montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { BPMN_VALIDO, PNG_VALIDO, comNome, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BPM = new File(['bizagi'], 'fonte.bpm')

// A versão histórica só se oferece em Não iniciados (ADR 0025): o processo p1 começa ali.
const montar = ({ ajustarProcessos, ...resto }: Montagem = {}) => montarNosCadastros({
  ...resto,
  ajustarProcessos: (falso) => {
    naEtapa('nao_iniciados')(falso)
    ajustarProcessos?.(falso)
  },
})

/** Uma versão histórica de teste (V{n}F): sem etapa, só com o .bpm. */
const historicaDeTeste = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})

const comHistoricas = (...numeros: number[]) => ({
  ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = numeros.map(historicaDeTeste) },
})

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Arquivos' }))
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
const escolherBpm = (form: Form) => escolher(form, 'Fluxograma Bizagi (.bpm) (opcional)', BPM)

async function preencherNumeroEBpm(form: Form, numero: string) {
  digitarNumero(form, numero)
  escolherBpm(form)
  await waitFor(() => expect(botaoRegistrar(form).disabled).toBe(false))
}

test.each(['administrador', 'integrante_ep'] as const)('o %s vê [Registrar versão histórica] no processo sem versão, em Não iniciados', async (perfil) => {
  montar({ perfil })
  const secao = await secaoDeVersoes()
  expect(await secao.findByRole('button', { name: BOTAO })).toBeTruthy()
})

test('com só versões históricas, o botão continua aparecendo', async () => {
  montar(comHistoricas(3, 4))
  const secao = await secaoDeVersoes()
  expect(await secao.findByRole('button', { name: BOTAO })).toBeTruthy()
})

test('com versão piloto ou em sequência, o botão não aparece', async () => {
  montar({ ajustarVersoes: (falso) => { falso.versoes.p1 = [historicaDeTeste(5), versaoDeTeste(6, { piloto: true })] } })
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V6P' })
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('fora de Não iniciados o botão não aparece, mesmo sem versão', async () => {
  montarNosCadastros()
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('a Consulta não vê o botão', async () => {
  montar({ perfil: 'consulta' })
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s não mostra o botão', async (situacao: SituacaoDoProcesso) => {
  montar({
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  })
  const secao = await secaoDeVersoes()
  await secao.findByText('Nenhuma versão enviada.')
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('o botão abre e fecha o formulário, que rola até aparecer', async () => {
  const rolar = vi.fn()
  Element.prototype.scrollIntoView = rolar
  montar()
  const secao = await secaoDeVersoes()
  const botao = await secao.findByRole('button', { name: BOTAO })
  fireEvent.click(botao)
  await secao.findByRole('form', { name: BOTAO })
  expect(rolar).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' })
  expect(botao.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(botao)
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(botao.getAttribute('aria-expanded')).toBe('false')
})

test('o formulário tem o número e os quatro campos de arquivo, sem observação, e começa sem poder registrar', async () => {
  montar()
  const { form } = await abrirFormulario()
  expect((form.getByLabelText('Número da versão') as HTMLInputElement).value).toBe('')
  for (const rotulo of ['.bpmn (opcional)', 'Imagem do fluxo (.png) (opcional)', 'Fluxograma Bizagi (.bpm) (opcional)',
    'Relatório (.docx ou .pdf) (opcional)']) {
    expect((form.getByLabelText(rotulo) as HTMLInputElement).type).toBe('file')
  }
  expect(form.queryByLabelText('Observação (opcional)')).toBeNull()
  expect(form.getByRole('group', { name: 'Arquivos', description: 'Informe o .bpm, ou o .bpmn com o .png.' })).toBeTruthy()
  expect(botaoRegistrar(form).disabled).toBe(true)
})

test.each(['', '0', '5.5', 'abc', '-3'])('o número "%s" não habilita o botão', async (texto) => {
  montar()
  const { form } = await abrirFormulario()
  escolherBpm(form)
  digitarNumero(form, texto)
  await waitFor(() => expect(form.getByLabelText('Fluxograma Bizagi (.bpm) (opcional)')).toBeTruthy())
  expect(botaoRegistrar(form).disabled).toBe(true)
  if (texto) expect(form.getByText('Digite um número inteiro maior que zero.')).toBeTruthy()
})

test('basta o .bpm; só o .bpmn ou só o .png não bastam; o par basta, com relatório opcional', async () => {
  montar()
  const { form } = await abrirFormulario()
  digitarNumero(form, '5')
  escolher(form, '.bpmn (opcional)', BPMN_VALIDO)
  expect(await form.findByText('Será gravado como: TSA_V5F_Emitir Ofício.bpmn')).toBeTruthy()
  expect(botaoRegistrar(form).disabled).toBe(true)
  escolher(form, 'Imagem do fluxo (.png) (opcional)', PNG_VALIDO)
  await waitFor(() => expect(botaoRegistrar(form).disabled).toBe(false))
  escolher(form, 'Relatório (.docx ou .pdf) (opcional)', new File(['r'], 'relatorio.docx'))
  expect(await form.findByText('Será gravado como: TSA_V5F_Emitir Ofício_Relatório.docx')).toBeTruthy()
  expect(botaoRegistrar(form).disabled).toBe(false)
})

test('a prévia diz o rótulo V5F e o nome do arquivo com o F', async () => {
  montar()
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '5')
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V5F.')
  expect(form.getByText('Será gravado como: TSA_V5F_Emitir Ofício.bpm')).toBeTruthy()
})

test('registrar a V5F fecha o formulário e a lista mostra a V5F, sem etapa, como somente leitura', async () => {
  const { versoes } = montar()
  const { secao, form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '5')
  fireEvent.click(botaoRegistrar(form))
  const v5f = within(await secao.findByRole('article', { name: 'V5F' }))
  expect(v5f.getByText('Histórica · somente leitura')).toBeTruthy()
  expect(v5f.queryByText('Reunião de modelagem')).toBeNull()
  expect(v5f.getByRole('link', { name: comNome('TSA_V5F_Emitir Ofício.bpm') })).toBeTruthy()
  expect(v5f.queryByRole('button')).toBeNull()
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(versoes.envios[0]).toMatchObject({ processoId: 'p1', numero: 5 })
})

test('registra várias históricas, da mais recente para a mais antiga, e o botão continua', async () => {
  montar()
  const { secao, form: primeiro } = await abrirFormulario()
  await preencherNumeroEBpm(primeiro, '3')
  fireEvent.click(botaoRegistrar(primeiro))
  await secao.findByRole('article', { name: 'V3F' })
  fireEvent.click(await secao.findByRole('button', { name: BOTAO }))
  const segundo = within(await secao.findByRole('form', { name: BOTAO }))
  await preencherNumeroEBpm(segundo, '4')
  fireEvent.click(botaoRegistrar(segundo))
  await secao.findByRole('article', { name: 'V4F' })
  expect(secao.getAllByRole('article', { name: /^V\d/ }).map((item) => item.getAttribute('aria-label'))).toEqual(['V4F', 'V3F'])
  expect(secao.getByRole('button', { name: BOTAO })).toBeTruthy()
})

test('a primeira versão em sequência continua a numeração (V5F → V6), na Revisão interna, e a histórica não é mais oferecida', async () => {
  montarNosCadastros({ ...comHistoricas(5), ajustarProcessos: naEtapa('revisao_interna') })
  const secao = await secaoDeVersoes()
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar versão' }))
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V6.')
  fireEvent.change(form.getByLabelText('Fluxograma Bizagi (.bpm)'), { target: { files: [BPM] } })
  const enviar = form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
  await waitFor(() => expect(enviar.disabled).toBe(false))
  fireEvent.click(enviar)
  await secao.findByRole('article', { name: 'V6' })
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
  expect(secao.getByRole('article', { name: 'V5F' })).toBeTruthy()
})

test('número de histórica repetido: a recusa aparece em vermelho e o formulário continua preenchido', async () => {
  montar(comHistoricas(5))
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
  montar({
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
  const { versoes } = montar({ ajustarVersoes: (falso) => { falso.falharNoArquivo = 1 } })
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '2')
  fireEvent.click(botaoRegistrar(form))
  expect((await form.findByRole('alert')).textContent).toBe(
    'A versão não foi registrada: o arquivo fonte.bpm não chegou ao Drive. Os arquivos escolhidos continuam no formulário.')
  expect(versoes.envios).toEqual([])
})

test('durante o registro, o progresso aparece e os campos ficam travados', async () => {
  montar({ ajustarVersoes: (falso) => { falso.segurarDepoisDe = 1 } })
  const { form } = await abrirFormulario()
  await preencherNumeroEBpm(form, '2')
  fireEvent.click(botaoRegistrar(form))
  expect((await form.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  expect(form.getByLabelText('Número da versão').matches(':disabled')).toBe(true)
  expect(botaoRegistrar(form).disabled).toBe(true)
})

test('[Cancelar] fecha o formulário da histórica sem registrar', async () => {
  const { versoes } = montar()
  const { secao, form } = await abrirFormulario()
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(versoes.envios).toEqual([])
})
