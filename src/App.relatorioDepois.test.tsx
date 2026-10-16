import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { SituacaoDoProcesso } from './processos/tipos'
import { montarNosCadastros } from './testes/reunioesNosCadastros'
import { arquivoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import { falhaDaFuncao } from './versoes/recusasDeVersoes'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const PDF = new File(['relatorio'], 'depois.pdf')

/** Versão nova com o relatório já enviado; sem ele, a versão é a de sempre (pendente). */
const comRelatorio = (numero: number) => versaoDeTeste(numero, {
  arquivos: [arquivoDeTeste(numero, 'bpmn', 'bpmn'), arquivoDeTeste(numero, 'png', 'png'), arquivoDeTeste(numero, 'relatorio', 'pdf')],
})
const historicaDeTeste = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})

/** H2 (histórica), V3 com relatório, V4 e V5 pendentes. */
const COM_PENDENTES = {
  ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = [historicaDeTeste(2), comRelatorio(3), versaoDeTeste(4), versaoDeTeste(5)] },
}
const semPendentes = { ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = [comRelatorio(1), comRelatorio(2)] } }

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
  return within(await painel.findByRole('region', { name: 'Versões do processo' }))
}

const BOTAO = 'Acrescentar relatório'

async function abrirFormulario(montagem: Parameters<typeof montarNosCadastros>[0] = COM_PENDENTES) {
  const falso = montarNosCadastros(montagem)
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: BOTAO }))
  return { ...falso, secao, form: within(await secao.findByRole('form', { name: BOTAO })) }
}

type Form = Awaited<ReturnType<typeof abrirFormulario>>['form']

const botaoAcrescentar = (form: Form) => form.getByRole('button', { name: 'Acrescentar' }) as HTMLButtonElement
const escolherRelatorio = (form: Form, arquivo: File) =>
  fireEvent.change(form.getByLabelText('Relatório (.docx ou .pdf)'), { target: { files: [arquivo] } })
const seletor = (form: Form) => form.getByLabelText('Versão') as HTMLSelectElement

test.each(['administrador', 'integrante_ep'] as const)('o %s vê [Acrescentar relatório] com versão pendente', async (perfil) => {
  montarNosCadastros({ ...COM_PENDENTES, perfil })
  expect(await (await secaoDeVersoes()).findByRole('button', { name: BOTAO })).toBeTruthy()
})

test('a marca "Relatório pendente" aparece só na versão nova sem relatório', async () => {
  montarNosCadastros(COM_PENDENTES)
  const secao = await secaoDeVersoes()
  for (const rotulo of ['V4', 'V5']) {
    expect(within(await secao.findByRole('listitem', { name: rotulo })).getByText('Relatório pendente')).toBeTruthy()
  }
  for (const rotulo of ['V3', 'V2F']) {
    expect(within(secao.getByRole('listitem', { name: rotulo })).queryByText('Relatório pendente')).toBeNull()
  }
})

test('a Consulta vê a marca e os links, sem nenhum botão de alteração', async () => {
  montarNosCadastros({ ...COM_PENDENTES, perfil: 'consulta' })
  const secao = await secaoDeVersoes()
  expect(within(await secao.findByRole('listitem', { name: 'V4' })).getByText('Relatório pendente')).toBeTruthy()
  expect(secao.queryByRole('button')).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s não mostra os botões do relatório', async (situacao: SituacaoDoProcesso) => {
  montarNosCadastros({
    ...COM_PENDENTES,
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  })
  const secao = await secaoDeVersoes()
  await secao.findByRole('listitem', { name: 'V4' })
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
  expect(secao.queryByRole('button', { name: 'Sem alteração de conteúdo' })).toBeNull()
})

test('sem versão pendente, não há [Acrescentar relatório]', async () => {
  montarNosCadastros(semPendentes)
  const secao = await secaoDeVersoes()
  await secao.findByRole('listitem', { name: 'V2' })
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('o formulário vem com a versão pendente mais recente escolhida e deixa trocar por outra', async () => {
  const { form } = await abrirFormulario()
  expect(seletor(form).value).toBe('v5')
  expect(within(seletor(form)).getAllByRole('option').map((opcao) => opcao.textContent)).toEqual(['V5', 'V4'])
  fireEvent.change(seletor(form), { target: { value: 'v4' } })
  expect(seletor(form).value).toBe('v4')
})

test('só .docx ou .pdf: o botão começa desabilitado, habilita com o .pdf e a prévia segue a versão escolhida', async () => {
  const { form } = await abrirFormulario()
  expect(botaoAcrescentar(form).disabled).toBe(true)
  escolherRelatorio(form, PDF)
  expect(await form.findByText('Será gravado como: TSA_V5_Emitir Ofício_Relatório.pdf')).toBeTruthy()
  expect(botaoAcrescentar(form).disabled).toBe(false)
  fireEvent.change(seletor(form), { target: { value: 'v4' } })
  expect(await form.findByText('Será gravado como: TSA_V4_Emitir Ofício_Relatório.pdf')).toBeTruthy()
})

test('um arquivo que não é .docx nem .pdf é recusado ao lado do campo e não habilita o botão', async () => {
  const { form } = await abrirFormulario()
  escolherRelatorio(form, new File(['x'], 'foto.png'))
  expect(await form.findByText('Escolha um arquivo .docx ou .pdf. Recebido: .png.')).toBeTruthy()
  expect(botaoAcrescentar(form).disabled).toBe(true)
})

test('acrescentar tira a marca da versão, mostra o relatório e fecha o formulário', async () => {
  const { secao, form, versoes } = await abrirFormulario()
  fireEvent.change(seletor(form), { target: { value: 'v4' } })
  escolherRelatorio(form, PDF)
  await waitFor(() => expect(botaoAcrescentar(form).disabled).toBe(false))
  fireEvent.click(botaoAcrescentar(form))
  const v4 = within(await secao.findByRole('listitem', { name: 'V4' }))
  expect(await v4.findByText('TSA_V4_Emitir Ofício_Relatório.pdf')).toBeTruthy()
  expect(v4.queryByText('Relatório pendente')).toBeNull()
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(within(secao.getByRole('listitem', { name: 'V5' })).getByText('Relatório pendente')).toBeTruthy()
  expect(versoes.versoes.p1.find((versao) => versao.id === 'v4')?.arquivos.map((arquivo) => arquivo.papel)).toContain('relatorio')
})

test('depois do último relatório pendente, o botão some', async () => {
  const { secao, form } = await abrirFormulario({
    ajustarVersoes: (falso) => { falso.versoes.p1 = [comRelatorio(1), versaoDeTeste(2)] },
  })
  escolherRelatorio(form, PDF)
  await waitFor(() => expect(botaoAcrescentar(form).disabled).toBe(false))
  fireEvent.click(botaoAcrescentar(form))
  await within(await secao.findByRole('listitem', { name: 'V2' })).findByText('TSA_V2_Emitir Ofício_Relatório.pdf')
  expect(secao.queryByRole('button', { name: BOTAO })).toBeNull()
})

test('o progresso aparece e o campo trava enquanto o relatório vai ao Drive', async () => {
  const { form, versoes } = await abrirFormulario()
  versoes.segurarDepoisDe = 1
  escolherRelatorio(form, PDF)
  await waitFor(() => expect(botaoAcrescentar(form).disabled).toBe(false))
  fireEvent.click(botaoAcrescentar(form))
  expect((await form.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  expect(form.getByLabelText('Relatório (.docx ou .pdf)').matches(':disabled')).toBe(true)
  expect(seletor(form).matches(':disabled')).toBe(true)
})

test('se o relatório não chega ao Drive, nada é registrado e o formulário continua preenchido', async () => {
  const { secao, form, versoes } = await abrirFormulario()
  versoes.falharNoArquivo = 1
  escolherRelatorio(form, PDF)
  await waitFor(() => expect(botaoAcrescentar(form).disabled).toBe(false))
  fireEvent.click(botaoAcrescentar(form))
  expect((await form.findByRole('alert')).textContent)
    .toBe('O relatório não foi registrado: o arquivo depois.pdf não chegou ao Drive. O arquivo escolhido continua no formulário.')
  expect(botaoAcrescentar(form).disabled).toBe(false)
  expect(within(secao.getByRole('listitem', { name: 'V5' })).getByText('Relatório pendente')).toBeTruthy()
})

test('a recusa do servidor vira a frase da tela, com o formulário preenchido', async () => {
  const { form, versoes } = await abrirFormulario()
  versoes.falhaNoRegistro = falhaDaFuncao('relatorio_ja_existe', '')
  escolherRelatorio(form, PDF)
  await waitFor(() => expect(botaoAcrescentar(form).disabled).toBe(false))
  fireEvent.click(botaoAcrescentar(form))
  expect((await form.findByRole('alert')).textContent).toBe('Esta versão já tem relatório.')
  expect(botaoAcrescentar(form).disabled).toBe(false)
})

test('Cancelar fecha o formulário sem enviar nada', async () => {
  const { secao, form, versoes } = await abrirFormulario()
  fireEvent.click(form.getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: BOTAO })).toBeNull()
  expect(versoes.envios).toHaveLength(0)
})

// "Sem alteração de conteúdo".
const SEM_ALTERACAO = 'Sem alteração de conteúdo'

test('[Sem alteração de conteúdo] só aparece na versão pendente cuja anterior tem relatório', async () => {
  montarNosCadastros(COM_PENDENTES)
  const secao = await secaoDeVersoes()
  expect(within(await secao.findByRole('listitem', { name: 'V4' })).getByRole('button', { name: SEM_ALTERACAO })).toBeTruthy()
  for (const rotulo of ['V5', 'V3', 'V2F']) {
    expect(within(secao.getByRole('listitem', { name: rotulo })).queryByRole('button', { name: SEM_ALTERACAO })).toBeNull()
  }
})

test('pede confirmação, copia o relatório da anterior e a versão mostra de qual veio', async () => {
  const { versoes } = montarNosCadastros(COM_PENDENTES)
  const secao = await secaoDeVersoes()
  fireEvent.click(within(await secao.findByRole('listitem', { name: 'V4' })).getByRole('button', { name: SEM_ALTERACAO }))
  const janela = within(screen.getByRole('dialog', { name: 'Marcar a V4 como sem alteração de conteúdo?' }))
  expect(janela.getByText('O relatório da V3 será copiado para a V4, com o nome da V4.')).toBeTruthy()
  expect(versoes.versoes.p1.find((versao) => versao.id === 'v4')?.arquivos).toHaveLength(2)
  fireEvent.click(janela.getByRole('button', { name: 'Copiar relatório' }))
  const v4 = within(await secao.findByRole('listitem', { name: 'V4' }))
  expect(await v4.findByText('TSA_V4_Emitir Ofício_Relatório.pdf')).toBeTruthy()
  expect(v4.getByText('Sem alteração de conteúdo · relatório da V3')).toBeTruthy()
  expect(v4.queryByText('Relatório pendente')).toBeNull()
  expect(v4.queryByRole('button', { name: SEM_ALTERACAO })).toBeNull()
  // A V5 agora tem anterior com relatório: o botão passa a aparecer nela.
  expect(within(secao.getByRole('listitem', { name: 'V5' })).getByRole('button', { name: SEM_ALTERACAO })).toBeTruthy()
})

test('Cancelar na confirmação não copia nada', async () => {
  const { versoes } = montarNosCadastros(COM_PENDENTES)
  const secao = await secaoDeVersoes()
  fireEvent.click(within(await secao.findByRole('listitem', { name: 'V4' })).getByRole('button', { name: SEM_ALTERACAO }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(versoes.versoes.p1.find((versao) => versao.id === 'v4')?.arquivos).toHaveLength(2)
})

test('a recusa do servidor no "sem alteração" aparece em vermelho e a versão continua pendente', async () => {
  const { versoes } = montarNosCadastros(COM_PENDENTES)
  versoes.falhaNoRegistro = new TravaDoBanco('A versão anterior não tem relatório para copiar. Envie o relatório.')
  const secao = await secaoDeVersoes()
  const v4 = within(await secao.findByRole('listitem', { name: 'V4' }))
  fireEvent.click(v4.getByRole('button', { name: SEM_ALTERACAO }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Copiar relatório' }))
  expect((await v4.findByRole('alert')).textContent).toBe('A versão anterior não tem relatório para copiar. Envie o relatório.')
  expect(v4.getByText('Relatório pendente')).toBeTruthy()
})

test('o relatório depois e o "sem alteração" entram no histórico do processo', async () => {
  const { secao, form } = await abrirFormulario()
  fireEvent.change(seletor(form), { target: { value: 'v4' } })
  escolherRelatorio(form, PDF)
  await waitFor(() => expect(botaoAcrescentar(form).disabled).toBe(false))
  fireEvent.click(botaoAcrescentar(form))
  await within(await secao.findByRole('listitem', { name: 'V4' })).findByText('TSA_V4_Emitir Ofício_Relatório.pdf')
  fireEvent.click(within(secao.getByRole('listitem', { name: 'V5' })).getByRole('button', { name: SEM_ALTERACAO }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Copiar relatório' }))
  await within(await secao.findByRole('listitem', { name: 'V5' })).findByText('TSA_V5_Emitir Ofício_Relatório.pdf')
  const painel = within(screen.getByRole('complementary', { name: 'Painel do processo' }))
  fireEvent.click(painel.getByRole('tab', { name: 'Histórico' }))
  const acrescentou = await painel.findByText('Acrescentou o relatório à versão')
  expect(acrescentou.parentElement?.textContent).toBe('Acrescentou o relatório à versão V4 — Emitir Ofício')
  const semAlteracao = await painel.findByText('Marcou sem alteração de conteúdo na versão')
  expect(semAlteracao.parentElement?.textContent).toBe('Marcou sem alteração de conteúdo na versão V5 — Emitir Ofício')
  expect(painel.getByText(/Relatório copiado da versão: V4/)).toBeTruthy()
})
