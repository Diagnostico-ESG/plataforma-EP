import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { SituacaoDoProcesso } from './processos/tipos'
import { type Montagem, montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { BPM_VALIDO, comNome, relatorioNumeradoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import { escolherNoMenuDoProcesso } from './testes/versoDoCartao'
import { falhaDaFuncao } from './versoes/recusasDeVersoes'
import type { VersoesFalso } from './versoes/VersoesFalso'
import type { Versao } from './versoes/tipos'

// O relatório com numeração própria (ADR 0026): enviado sozinho ou junto com a versão, o que vale em cada versão e o que saiu.
beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const DOCX = new File(['relatorio'], 'depois.docx')
const ENVIAR = 'Enviar relatório'

const historicaDeTeste = (numero: number): Versao => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [
    { id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 },
    { id: `hr${numero}`, papel: 'relatorio', nome: `TSA_V${numero}F_Emitir Ofício_Relatório.docx`, formato: 'docx', tamanho: 10 },
  ],
})
const comRelatorios = (numero: number, ...numeros: number[]): Versao => {
  const base = versaoDeTeste(numero)
  return { ...base, arquivos: [...base.arquivos, ...numeros.map((n) => relatorioNumeradoDeTeste(numero, n))] }
}

/** H5 (histórica com relatório), V6 com o Relatório V1, V7 com o Relatório V2 e V8 sem relatório: o próximo é o V3, na V8. */
const montagem = (etapa = 'relatorio_modelagem_tecnica', mais: Montagem = {}): Montagem => ({
  ...mais,
  ajustarProcessos: (falso) => {
    naEtapa(etapa)(falso)
    mais.ajustarProcessos?.(falso)
  },
  ajustarVersoes: (falso: VersoesFalso) => {
    falso.versoes.p1 = [historicaDeTeste(5), comRelatorios(6, 1), comRelatorios(7, 2), versaoDeTeste(8)]
    mais.ajustarVersoes?.(falso)
  },
})

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Documentos do Mapeamento' }))
}

async function abrirFormulario(mais: Montagem = {}) {
  const falso = montarNosCadastros(montagem('relatorio_modelagem_tecnica', mais))
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: ENVIAR }))
  return { ...falso, secao, form: within(await secao.findByRole('form', { name: ENVIAR })) }
}

type Form = Awaited<ReturnType<typeof abrirFormulario>>['form']

const botaoEnviar = (form: Form) => form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
const campo = (form: Form) => form.getByLabelText('Relatório (.docx)')
const escolher = (form: Form, arquivo: File) => fireEvent.change(campo(form), { target: { files: [arquivo] } })

async function enviarOFormulario(form: Form) {
  escolher(form, DOCX)
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(form))
}

test.each([
  ['relatorio_modelagem_tecnica', true],
  ['revisao_interna', true],
  ['nao_iniciados', false],
  ['modelagem', false],
  ['revisao_setor', false],
  ['aprovacao_setor', false],
  ['publicacao', false],
  ['concluidos', false],
])('na etapa %s o [Enviar relatório] aparece: %s', async (etapa, aparece) => {
  montarNosCadastros(montagem(etapa))
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V8' })
  expect(secao.queryByRole('button', { name: ENVIAR }) !== null).toBe(aparece)
})

test.each(['administrador', 'integrante_ep'] as const)('o %s vê [Enviar relatório]', async (perfil) => {
  montarNosCadastros(montagem('relatorio_modelagem_tecnica', { perfil }))
  expect(await (await secaoDeVersoes()).findByRole('button', { name: ENVIAR })).toBeTruthy()
})

test('sem versão piloto nem em sequência (só a histórica), não há [Enviar relatório]', async () => {
  montarNosCadastros(montagem('relatorio_modelagem_tecnica', {
    ajustarVersoes: (falso) => { falso.versoes.p1 = [historicaDeTeste(5)] },
  }))
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V5F' })
  expect(secao.queryByRole('button', { name: ENVIAR })).toBeNull()
})

test('a Consulta vê os relatórios e baixa, sem nenhum botão de alteração', async () => {
  montarNosCadastros(montagem('relatorio_modelagem_tecnica', { perfil: 'consulta' }))
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V8' })
  expect(secao.queryByRole('button')).toBeNull()
  expect(secao.getByRole('link', { name: comNome('Relatório V1') })).toBeTruthy()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s não mostra [Enviar relatório] nem [Substituir]', async (situacao: SituacaoDoProcesso) => {
  montarNosCadastros(montagem('relatorio_modelagem_tecnica', {
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  }))
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V8' })
  expect(secao.queryByRole('button')).toBeNull()
})

test('nada de pendência: sem a marca "falta relatório", sem "Relatório pendente" e sem [Sem alteração de conteúdo] nem [Acrescentar relatório]', async () => {
  montarNosCadastros(montagem())
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V8' })
  for (const texto of ['falta relatório', 'Relatório pendente']) expect(secao.queryByText(texto)).toBeNull()
  for (const nome of ['Sem alteração de conteúdo', 'Acrescentar relatório', 'Mais ações dos arquivos']) {
    expect(secao.queryByRole('button', { name: nome })).toBeNull()
  }
})

test('cada versão mostra o relatório que vale: o seu, ou o último anterior com "(da V7)"; a histórica, "Relatório da V5F"', async () => {
  montarNosCadastros(montagem())
  const secao = await secaoDeVersoes()
  const v8 = within(await secao.findByRole('article', { name: 'V8' }))
  expect(v8.getByRole('link', { name: comNome('Relatório V2 (da V7)') })).toBeTruthy()
  expect(within(secao.getByRole('article', { name: 'V7' })).getByRole('link', { name: comNome('Relatório V2') })).toBeTruthy()
  expect(within(secao.getByRole('article', { name: 'V6' })).getByRole('link', { name: comNome('Relatório V1') })).toBeTruthy()
  expect(within(secao.getByRole('article', { name: 'V5F' })).getByRole('link', { name: comNome('Relatório da V5F') })).toBeTruthy()
})

test('antes do primeiro relatório numerado a versão não mostra relatório; o .pdf antigo aparece como está e não vale adiante', async () => {
  montarNosCadastros(montagem('relatorio_modelagem_tecnica', {
    ajustarVersoes: (falso) => {
      const antigo = { id: 'pdf-antigo', papel: 'relatorio' as const, nome: 'TSA_V3_Emitir Ofício_Relatório.pdf', formato: 'pdf', tamanho: 10 }
      falso.versoes.p1 = [versaoDeTeste(2), { ...versaoDeTeste(3), arquivos: [...versaoDeTeste(3).arquivos, antigo] }, versaoDeTeste(4)]
    },
  }))
  const secao = await secaoDeVersoes()
  expect(within(await secao.findByRole('article', { name: 'V4' })).queryByRole('link', { name: comNome('Relatório') })).toBeNull()
  expect(within(secao.getByRole('article', { name: 'V3' })).getByRole('link', { name: comNome('Relatório .pdf') })).toBeTruthy()
  expect(within(secao.getByRole('article', { name: 'V2' })).queryByRole('link', { name: comNome('Relatório') })).toBeNull()
})

test('o formulário diz o número do relatório e a versão que ele acompanha; o botão começa desabilitado', async () => {
  const { form } = await abrirFormulario()
  expect(form.getByText('Relatório V3, acompanha a V8')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(true)
  escolher(form, DOCX)
  expect(await form.findByText('Será gravado como: TSA_V8_Emitir Ofício_Relatório V3.docx')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(false)
})

test('um arquivo que não é .docx (o .pdf) é recusado ao lado do campo e não habilita o botão', async () => {
  const { form } = await abrirFormulario()
  escolher(form, new File(['x'], 'antigo.pdf'))
  expect(await form.findByText('Escolha um arquivo .docx. Recebido: .pdf.')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(true)
})

test('enviar liga o relatório à V8 com o próximo número, mostra-o em vez do anterior e fecha o formulário', async () => {
  const { secao, form, versoes } = await abrirFormulario()
  await enviarOFormulario(form)
  const v8 = within(await secao.findByRole('article', { name: 'V8' }))
  expect(await v8.findByRole('link', { name: comNome('Relatório V3') })).toBeTruthy()
  expect(v8.queryByRole('link', { name: comNome('(da V7)') })).toBeNull()
  expect(secao.queryByRole('form', { name: ENVIAR })).toBeNull()
  const relatorio = versoes.versoes.p1.find((versao) => versao.id === 'v8')?.arquivos.find((arquivo) => arquivo.papel === 'relatorio')
  expect(relatorio).toMatchObject({ nome: 'TSA_V8_Emitir Ofício_Relatório V3.docx', numeroDoRelatorio: 3 })
})

test('um segundo relatório na mesma versão é o Relatório V4, e a V8 mostra os dois', async () => {
  const { secao, form } = await abrirFormulario()
  await enviarOFormulario(form)
  const v8 = within(await secao.findByRole('article', { name: 'V8' }))
  await v8.findByRole('link', { name: comNome('Relatório V3') })
  fireEvent.click(secao.getByRole('button', { name: ENVIAR }))
  const segundo = within(await secao.findByRole('form', { name: ENVIAR }))
  expect(segundo.getByText('Relatório V4, acompanha a V8')).toBeTruthy()
  await enviarOFormulario(segundo)
  expect(await v8.findByRole('link', { name: comNome('Relatório V4') })).toBeTruthy()
  expect(v8.getByRole('link', { name: comNome('Relatório V3') })).toBeTruthy()
})

test('o relatório enviado junto com a versão em sequência recebe o próximo número e fica ligado a ela', async () => {
  montarNosCadastros(montagem())
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar versão' }))
  fireEvent.change(form.getByLabelText('Fluxograma Bizagi (.bpm)'), { target: { files: [BPM_VALIDO] } })
  fireEvent.change(form.getByLabelText('Relatório (.docx) (opcional)'), { target: { files: [DOCX] } })
  expect(await form.findByText('Será gravado como: TSA_V9_Emitir Ofício_Relatório V3.docx')).toBeTruthy()
  const enviar = form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
  await waitFor(() => expect(enviar.disabled).toBe(false))
  fireEvent.click(enviar)
  const v9 = within(await secao.findByRole('article', { name: 'V9' }))
  expect(await v9.findByRole('link', { name: comNome('Relatório V3') })).toBeTruthy()
})

test('a versão piloto não tem campo de relatório', async () => {
  montarNosCadastros(montagem('modelagem', {
    ajustarVersoes: (falso) => { falso.versoes.p1 = [] },
  }))
  const secao = await secaoDeVersoes()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar versão piloto' }))
  const form = within(await secao.findByRole('form', { name: 'Enviar versão piloto' }))
  expect(form.queryByLabelText(/^Relatório/)).toBeNull()
})

test('o progresso aparece e o campo trava enquanto o relatório vai ao Drive', async () => {
  const { form, versoes } = await abrirFormulario()
  versoes.segurarDepoisDe = 1
  await enviarOFormulario(form)
  expect((await form.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  expect(campo(form).matches(':disabled')).toBe(true)
})

test('se o relatório não chega ao Drive, nada é registrado e o formulário continua preenchido', async () => {
  const { secao, form, versoes } = await abrirFormulario()
  versoes.falharNoArquivo = 1
  await enviarOFormulario(form)
  expect((await form.findByRole('alert')).textContent)
    .toBe('O relatório não foi registrado: o arquivo depois.docx não chegou ao Drive. O arquivo escolhido continua no formulário.')
  expect(botaoEnviar(form).disabled).toBe(false)
  expect(within(secao.getByRole('article', { name: 'V8' })).getByRole('link', { name: comNome('(da V7)') })).toBeTruthy()
})

test('a recusa do servidor vira a frase da tela, com o formulário preenchido', async () => {
  const { form, versoes } = await abrirFormulario()
  versoes.falhaNoRegistro = falhaDaFuncao('numero_do_relatorio_mudou', '4')
  await enviarOFormulario(form)
  expect((await form.findByRole('alert')).textContent)
    .toBe('Outra pessoa enviou um relatório enquanto você enviava; este seria o Relatório V4. Envie de novo.')
  expect(botaoEnviar(form).disabled).toBe(false)
})

test('o botão abre e fecha o formulário, e Cancelar fecha sem enviar nada', async () => {
  const { secao, form, versoes } = await abrirFormulario()
  fireEvent.click(secao.getByRole('button', { name: ENVIAR }))
  expect(secao.queryByRole('form', { name: ENVIAR })).toBeNull()
  fireEvent.click(secao.getByRole('button', { name: ENVIAR }))
  fireEvent.click(within(await secao.findByRole('form', { name: ENVIAR })).getByRole('button', { name: 'Cancelar' }))
  expect(secao.queryByRole('form', { name: ENVIAR })).toBeNull()
  expect(form).toBeTruthy()
  expect(versoes.envios).toHaveLength(0)
})

// Substituir.
const menuDe = (nome: string) => ({ name: `Ações de ${nome}` })

test('o relatório numerado da própria versão tem [Substituir]; o de outra versão ("da V7") e o da histórica não', async () => {
  montarNosCadastros(montagem())
  const secao = await secaoDeVersoes()
  const v7 = within(await secao.findByRole('article', { name: 'V7' }))
  expect(v7.getByRole('button', menuDe('TSA_V7_Emitir Ofício_Relatório V2.docx'))).toBeTruthy()
  const v8 = within(secao.getByRole('article', { name: 'V8' }))
  expect(v8.queryByRole('button', menuDe('TSA_V7_Emitir Ofício_Relatório V2.docx'))).toBeNull()
  expect(within(secao.getByRole('article', { name: 'V5F' })).queryByRole('button', menuDe('TSA_V5F_Emitir Ofício_Relatório.docx'))).toBeNull()
})

test('substituir o relatório numerado: o formulário abre e a troca mantém o número', async () => {
  const { versoes } = montarNosCadastros(montagem())
  const secao = await secaoDeVersoes()
  const v7 = within(await secao.findByRole('article', { name: 'V7' }))
  fireEvent.click(v7.getByRole('button', menuDe('TSA_V7_Emitir Ofício_Relatório V2.docx')))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Substituir' }))
  const form = within(await v7.findByRole('form'))
  fireEvent.change(form.getByLabelText('Relatório (.docx)'), { target: { files: [new File(['novo'], 'revisado.docx')] } })
  await waitFor(() => expect((form.getByRole('button', { name: 'Substituir' }) as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(form.getByRole('button', { name: 'Substituir' }))
  fireEvent.click(within(await screen.findByRole('dialog', { name: /^Substituir TSA_V7/ })).getByRole('button', { name: 'Substituir' }))
  await waitFor(() => expect(v7.queryByRole('form')).toBeNull())
  const arquivo = versoes.versoes.p1.find((versao) => versao.id === 'v7')?.arquivos.find((outro) => outro.papel === 'relatorio')
  expect(arquivo).toMatchObject({ numeroDoRelatorio: 2, nome: 'TSA_V7_Emitir Ofício_Relatório V2.docx' })
})

test('o relatório ligado à versão aprovada não tem [Substituir]', async () => {
  montarNosCadastros(montagem('relatorio_modelagem_tecnica', { ajustarVersoes: (falso) => { falso.aprovadas.p1 = 7 } }))
  const secao = await secaoDeVersoes()
  const v7 = within(await secao.findByRole('article', { name: 'V7' }))
  await v7.findByText('Aprovada')
  expect(v7.queryByRole('button', menuDe('TSA_V7_Emitir Ofício_Relatório V2.docx'))).toBeNull()
})

test('o relatório enviado entra no histórico do processo, com a versão que ele acompanha', async () => {
  const { secao, form } = await abrirFormulario()
  await enviarOFormulario(form)
  await within(await secao.findByRole('article', { name: 'V8' })).findByRole('link', { name: comNome('Relatório V3') })
  const painel = within(screen.getByRole('dialog', { name: /^Processo( |$)/ }))
  await escolherNoMenuDoProcesso('Histórico')
  const evento = await painel.findByText('Enviou o Relatório V3 (acompanha a V8)')
  expect(evento.parentElement?.textContent).toBe('Enviou o Relatório V3 (acompanha a V8) V8 — Emitir Ofício')
})
