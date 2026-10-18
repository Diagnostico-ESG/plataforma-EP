import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { montarNosCadastros } from './testes/processosNosCadastros'
import { BPMN_VALIDO, PNG_VALIDO, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const comDuasVersoes = (ajuste?: (falso: VersoesFalso) => void) => ({
  ajustarVersoes: (falso: VersoesFalso) => {
    falso.versoes.p1 = [versaoDeTeste(1), versaoDeTeste(2)]
    ajuste?.(falso)
  },
})

async function abrirFormulario() {
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  const secao = within(await painel.findByRole('region', { name: 'Versões do processo' }))
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  return { secao, form: within(await secao.findByRole('form', { name: 'Enviar versão' })) }
}

type Form = Awaited<ReturnType<typeof abrirFormulario>>['form']

function escolher(form: Form, rotulo: string, arquivo: File) {
  fireEvent.change(form.getByLabelText(rotulo), { target: { files: [arquivo] } })
}

const botaoEnviar = (form: Form) => form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement

async function escolherOPar(form: Form) {
  escolher(form, 'Fluxograma (.bpmn)', BPMN_VALIDO)
  escolher(form, 'Imagem do fluxograma (.png)', PNG_VALIDO)
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
}

test('[Enviar versão] abre o formulário com os quatro campos, a observação e o número da versão', async () => {
  montarNosCadastros(comDuasVersoes())
  const { form } = await abrirFormulario()
  for (const rotulo of ['Fluxograma (.bpmn)', 'Imagem do fluxograma (.png)', 'Arquivo do Bizagi (.bpm) (opcional)',
    'Relatório (.docx ou .pdf) (opcional)']) {
    expect((form.getByLabelText(rotulo) as HTMLInputElement).type).toBe('file')
  }
  expect((form.getByLabelText('Observação (opcional)') as HTMLTextAreaElement).maxLength).toBe(2000)
  expect(form.getByText(/Esta versão será a/).textContent).toBe('Esta versão será a V3.')
  expect(botaoEnviar(form).disabled).toBe(true)
})

test('o botão de enviar só se habilita com o .bpmn e o .png; a prévia mostra o nome de cada arquivo', async () => {
  montarNosCadastros(comDuasVersoes())
  const { form } = await abrirFormulario()
  escolher(form, 'Fluxograma (.bpmn)', BPMN_VALIDO)
  expect(await form.findByText('Será gravado como: TSA_V3_Emitir Ofício.bpmn')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(true)
  escolher(form, 'Imagem do fluxograma (.png)', PNG_VALIDO)
  expect(await form.findByText('Será gravado como: TSA_V3_Emitir Ofício.png')).toBeTruthy()
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
})

test('enviar registra a versão, fecha o formulário e a lista mostra a V3 no alto, com a etapa atual', async () => {
  const { versoes } = montarNosCadastros(comDuasVersoes())
  const { secao, form } = await abrirFormulario()
  await escolherOPar(form)
  fireEvent.change(form.getByLabelText('Observação (opcional)'), { target: { value: 'Primeira técnica' } })
  fireEvent.click(botaoEnviar(form))
  const v3 = within(await secao.findByRole('listitem', { name: 'V3' }))
  expect(secao.getAllByRole('listitem', { name: /^V\d/ })[0].getAttribute('aria-label')).toBe('V3')
  expect(v3.getByText('Reunião de modelagem')).toBeTruthy()
  expect(v3.getByText('Primeira técnica')).toBeTruthy()
  expect(secao.queryByRole('form', { name: 'Enviar versão' })).toBeNull()
  expect(versoes.envios[0]).toMatchObject({ processoId: 'p1', numero: 3, observacao: 'Primeira técnica' })
})

test('o .bpm e o relatório vão junto, na ordem dos papéis', async () => {
  const { versoes } = montarNosCadastros(comDuasVersoes())
  const { secao, form } = await abrirFormulario()
  escolher(form, 'Relatório (.docx ou .pdf) (opcional)', new File(['r'], 'relatorio.docx'))
  escolher(form, 'Arquivo do Bizagi (.bpm) (opcional)', new File(['b'], 'fluxo.bpm'))
  await escolherOPar(form)
  fireEvent.click(botaoEnviar(form))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Enviar versão' })).toBeNull())
  expect(versoes.envios[0].arquivos.map((arquivo) => arquivo.papel)).toEqual(['bpmn', 'png', 'bpm', 'relatorio'])
})

test.each([
  ['extensão errada', 'Fluxograma (.bpmn)', new File(['x'], 'fluxo.xml'), 'Escolha um arquivo .bpmn. Recebido: .xml.'],
  ['.png que não é imagem', 'Imagem do fluxograma (.png)', new File(['texto'], 'fluxo.png'), 'O arquivo não é uma imagem PNG.'],
  ['.bpmn que não é BPMN', 'Fluxograma (.bpmn)', new File(['<outro/>'], 'fluxo.bpmn'),
    'O arquivo não é um BPMN 2.0 (falta o elemento definitions do BPMN).'],
  ['arquivo maior que 20 MB', 'Arquivo do Bizagi (.bpm) (opcional)', new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'grande.bpm'),
    'O arquivo passa de 20 MB. Recebido: 20,0 MB (20971521 bytes).'],
])('%s: a mensagem aparece ao lado do campo e o envio fica desabilitado', async (_caso, rotulo, arquivo, mensagem) => {
  montarNosCadastros(comDuasVersoes())
  const { form } = await abrirFormulario()
  await escolherOPar(form)
  escolher(form, rotulo, arquivo)
  const recusa = await form.findByText(mensagem)
  expect(form.getByLabelText(rotulo).getAttribute('aria-describedby')).toBe(recusa.id)
  expect(botaoEnviar(form).disabled).toBe(true)
})

test('durante o envio, o progresso aparece e os campos ficam travados', async () => {
  montarNosCadastros(comDuasVersoes((falso) => { falso.segurarDepoisDe = 1 }))
  const { form } = await abrirFormulario()
  await escolherOPar(form)
  fireEvent.click(botaoEnviar(form))
  expect((await form.findByRole('status')).textContent).toBe('Enviando 2 de 2…')
  // Os campos ficam travados pelo grupo (fieldset desabilitado): o estado é :disabled, não a propriedade do campo.
  expect(form.getByLabelText('Fluxograma (.bpmn)').matches(':disabled')).toBe(true)
  expect(form.getByLabelText('Observação (opcional)').matches(':disabled')).toBe(true)
  expect(botaoEnviar(form).disabled).toBe(true)
})

test('se um arquivo falha, nada é registrado, a mensagem aparece em vermelho e o formulário continua preenchido', async () => {
  const { versoes } = montarNosCadastros(comDuasVersoes((falso) => { falso.falharNoArquivo = 2 }))
  const { secao, form } = await abrirFormulario()
  await escolherOPar(form)
  fireEvent.change(form.getByLabelText('Observação (opcional)'), { target: { value: 'Mantida' } })
  fireEvent.click(botaoEnviar(form))
  const alerta = await form.findByRole('alert')
  expect(alerta.textContent).toBe(
    'A versão não foi registrada: o arquivo fluxo.png não chegou ao Drive. Os arquivos escolhidos continuam no formulário.')
  expect(alerta.className).toContain('cadastros-falha')
  expect((form.getByLabelText('Observação (opcional)') as HTMLTextAreaElement).value).toBe('Mantida')
  expect(form.getByText('Será gravado como: TSA_V3_Emitir Ofício.png')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(false)
  expect(versoes.envios).toEqual([])
  expect(secao.getAllByRole('listitem', { name: /^V\d/ })).toHaveLength(2)
})

test('a recusa no registro aparece com a frase pronta', async () => {
  montarNosCadastros(comDuasVersoes((falso) => {
    falso.falhaNoRegistro = new TravaDoBanco('Outra pessoa enviou uma versão enquanto você enviava; esta seria a V4. Envie de novo.')
  }))
  const { form } = await abrirFormulario()
  await escolherOPar(form)
  fireEvent.click(botaoEnviar(form))
  expect((await form.findByRole('alert')).textContent)
    .toBe('Outra pessoa enviou uma versão enquanto você enviava; esta seria a V4. Envie de novo.')
})

test('[Cancelar] fecha o formulário sem enviar', async () => {
  const { versoes } = montarNosCadastros(comDuasVersoes())
  const { secao, form } = await abrirFormulario()
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: 'Enviar versão' })).toBeNull()
  expect(secao.getByRole('button', { name: 'Enviar versão' })).toBeTruthy()
  expect(versoes.envios).toEqual([])
})
