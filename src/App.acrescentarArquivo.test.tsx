import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { BPMN_VALIDO, PNG_VALIDO, arquivoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import { escolherNoMenuDoProcesso } from './testes/versoDoCartao'
import type { Versao } from './versoes/tipos'
import type { VersoesFalso } from './versoes/VersoesFalso'
import type { Montagem } from './testes/processosNosCadastros'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const soBpm = (numero: number, mudancas: Partial<Versao> = {}): Versao =>
  versaoDeTeste(numero, { arquivos: [arquivoDeTeste(numero, 'bpm', 'bpm')], ...mudancas })

const com = (versoes: Versao[], mais: Montagem & { aprovada?: number } = {}): Montagem => {
  const { aprovada, ...resto } = mais
  return {
    ajustarProcessos: naEtapa('revisao_interna'),
    ...resto,
    ajustarVersoes: (falso: VersoesFalso) => {
      falso.versoes.p1 = versoes
      if (aprovada) falso.aprovadas.p1 = aprovada
      resto.ajustarVersoes?.(falso)
    },
  }
}

async function destaqueDa(rotulo: string) {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  const secao = within(await painel.findByRole('region', { name: 'Arquivos' }))
  return { painel, secao, versao: within(await secao.findByRole('article', { name: rotulo })) }
}

const escolher = (campo: HTMLElement, arquivo: File) => fireEvent.change(campo, { target: { files: [arquivo] } })

test('a versão sem .png nem .bpmn mostra os dois no espaço tracejado, e a que os tem não mostra nenhum', async () => {
  montarNosCadastros(com([versaoDeTeste(1), soBpm(2)]))
  const { secao, versao } = await destaqueDa('V2')
  expect(versao.getByLabelText(/Acrescentar .png/)).toBeTruthy()
  expect(versao.getByLabelText(/Acrescentar .bpmn/)).toBeTruthy()
  secao.getByText('Versões anteriores (1)').click()
  const v1 = within(secao.getByRole('article', { name: 'V1' }))
  expect(v1.queryByLabelText(/Acrescentar .png/)).toBeNull()
  expect(v1.getByLabelText(/Acrescentar .bpmn/)).toBeTruthy()
})

test('acrescentar o .png envia ali mesmo: o arquivo aparece com o nome padrão e o espaço some', async () => {
  const { versoes } = montarNosCadastros(com([soBpm(7)]))
  const { versao } = await destaqueDa('V7')
  escolher(versao.getByLabelText(/Acrescentar .png/), PNG_VALIDO)
  expect(await versao.findByRole('link', { name: (nome) => nome.includes('TSA_V7_Emitir Ofício.png') })).toBeTruthy()
  expect(versao.queryByLabelText(/Acrescentar .png/)).toBeNull()
  expect(versao.getByLabelText(/Acrescentar .bpmn/)).toBeTruthy()
  expect(versoes.versoes.p1[0].arquivos.map((arquivo) => arquivo.papel)).toEqual(['bpm', 'png'])
})

test('acrescentar o .bpmn também; na versão piloto o nome leva o P', async () => {
  montarNosCadastros(com([soBpm(6, { piloto: true })], { ajustarProcessos: naEtapa('modelagem') }))
  const { versao } = await destaqueDa('V6P')
  escolher(versao.getByLabelText(/Acrescentar .bpmn/), BPMN_VALIDO)
  expect(await versao.findByRole('link', { name: (nome) => nome.includes('TSA_V6P_Emitir Ofício.bpmn') })).toBeTruthy()
})

test('vale em qualquer etapa com o processo em andamento, inclusive depois da Revisão interna', async () => {
  montarNosCadastros(com([soBpm(7)], { ajustarProcessos: naEtapa('publicacao') }))
  const { versao } = await destaqueDa('V7')
  escolher(versao.getByLabelText(/Acrescentar .png/), PNG_VALIDO)
  expect(await versao.findByRole('link', { name: (nome) => nome.includes('TSA_V7_Emitir Ofício.png') })).toBeTruthy()
})

test('não aparece na versão aprovada, na histórica, para a Consulta nem no processo suspenso', async () => {
  const historica = versaoDeTeste(5, {
    historica: true, etapa: null,
    arquivos: [{ id: 'h5', papel: 'bpm', nome: 'TSA_V5F_Emitir Ofício.bpm', formato: 'bpm', tamanho: 10 }],
  })
  montarNosCadastros(com([historica], { ajustarProcessos: naEtapa('nao_iniciados') }))
  expect((await destaqueDa('V5F')).versao.queryByLabelText(/Acrescentar .(png|bpmn)/)).toBeNull()
  cleanup()
  montarNosCadastros(com([soBpm(7)], { aprovada: 7 }))
  expect((await destaqueDa('V7')).versao.queryByLabelText(/Acrescentar .(png|bpmn)/)).toBeNull()
  cleanup()
  montarNosCadastros(com([soBpm(7)], { perfil: 'consulta' }))
  expect((await destaqueDa('V7')).versao.queryByLabelText(/Acrescentar .(png|bpmn)/)).toBeNull()
  cleanup()
  montarNosCadastros(com([soBpm(7)], {
    ajustarProcessos: (falso) => {
      naEtapa('revisao_interna')(falso)
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao: 'suspenso' } : processo))
    },
  }))
  expect((await destaqueDa('V7')).versao.queryByLabelText(/Acrescentar .(png|bpmn)/)).toBeNull()
})

test('o arquivo que não passa na conferência do navegador mostra a frase e nada é enviado', async () => {
  const { versoes } = montarNosCadastros(com([soBpm(7)]))
  const { versao } = await destaqueDa('V7')
  escolher(versao.getByLabelText(/Acrescentar .png/), new File(['texto'], 'fluxo.png'))
  expect((await versao.findByRole('alert')).textContent).toBe('O arquivo não é uma imagem PNG.')
  expect(versoes.versoes.p1[0].arquivos).toHaveLength(1)
})

test('a falha no envio mostra a frase, e o espaço continua para tentar de novo', async () => {
  montarNosCadastros(com([soBpm(7)], { ajustarVersoes: (falso) => { falso.falhaNoRegistro = 'sem conexão' } }))
  const { versao } = await destaqueDa('V7')
  escolher(versao.getByLabelText(/Acrescentar .png/), PNG_VALIDO)
  expect((await versao.findByRole('alert')).textContent).toBe('O arquivo não foi registrado: sem conexão. Tente de novo.')
  expect(versao.getByLabelText(/Acrescentar .png/)).toBeTruthy()
})

test('durante o envio o espaço mostra o progresso e fica travado', async () => {
  montarNosCadastros(com([soBpm(7)], { ajustarVersoes: (falso) => { falso.segurarDepoisDe = 1 } }))
  const { versao } = await destaqueDa('V7')
  escolher(versao.getByLabelText(/Acrescentar .png/), PNG_VALIDO)
  expect((await versao.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  await waitFor(() => expect(versao.getByLabelText(/Acrescentar .png/).matches(':disabled')).toBe(true))
})

test('o arquivo acrescentado aparece no histórico do processo, dizendo qual é', async () => {
  montarNosCadastros(com([soBpm(7)]))
  const { painel, versao } = await destaqueDa('V7')
  escolher(versao.getByLabelText(/Acrescentar .png/), PNG_VALIDO)
  await versao.findByRole('link', { name: (nome) => nome.includes('TSA_V7_Emitir Ofício.png') })
  await escolherNoMenuDoProcesso('Histórico')
  const evento = await painel.findByText('Acrescentou o .png à versão')
  expect(evento.parentElement?.textContent).toBe('Acrescentou o .png à versão V7 — Emitir Ofício')
})
