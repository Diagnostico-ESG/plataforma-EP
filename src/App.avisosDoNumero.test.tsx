import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { montarNosCadastros } from './testes/processosNosCadastros'
import { versaoDeTeste } from './testes/versoesDeTeste'
import { escolherNoMenu } from './testes/versoDoCartao'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const historica = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})

/** V2F (histórica), V3 e V4 (em sequência); a V4 é a aprovada quando `aprovada`. */
const versoes = (aprovada = false) => ({
  ajustarVersoes: (falso: VersoesFalso) => {
    falso.versoes.p1 = [historica(2), versaoDeTeste(3), versaoDeTeste(4, aprovada ? { aprovada } : {})]
  },
})

async function abrirJanela(rotulo: string, montagem = versoes()) {
  const falso = montarNosCadastros(montagem)
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  const secao = within(await painel.findByRole('region', { name: 'Arquivos' }))
  if (rotulo !== 'V4') fireEvent.click(await secao.findByText(/Versões anteriores/))
  await escolherNoMenu(`Ações da ${rotulo}`, 'Editar número')
  const janela = within(await screen.findByRole('dialog', { name: `Editar número da ${rotulo}` }))
  return { ...falso, secao, janela }
}

type Janela = Awaited<ReturnType<typeof abrirJanela>>['janela']
const digitar = (janela: Janela, texto: string) => fireEvent.change(janela.getByLabelText('Número da versão'), { target: { value: texto } })
const gravar = (janela: Janela) => janela.getByRole('button', { name: /^(Gravar|Salvando…)$/ }) as HTMLButtonElement

test('sem quebrar a ordem, a janela não mostra aviso', async () => {
  const { janela } = await abrirJanela('V2F')
  digitar(janela, '1')
  expect(janela.queryByText('Gravar assim mesmo?')).toBeNull()
})

test('o salto em sequência aparece enquanto se digita e acompanha o número digitado', async () => {
  const { janela } = await abrirJanela('V4')
  digitar(janela, '6')
  expect(janela.getByText('A V6 ficará depois da V3, sem a V5.')).toBeTruthy()
  expect(janela.getByText('Gravar assim mesmo?')).toBeTruthy()
  digitar(janela, '7')
  expect(janela.queryByText('A V6 ficará depois da V3, sem a V5.')).toBeNull()
  expect(janela.getByText('A V7 ficará depois da V3, sem a V6.')).toBeTruthy()
})

test('a histórica que passa das versões em sequência avisa a ordem dos tipos', async () => {
  const { janela } = await abrirJanela('V2F')
  digitar(janela, '5')
  expect(janela.getByText('A V5F ficará depois da V4.')).toBeTruthy()
})

test('a versão aprovada lembra que o E-protocolo cita o número', async () => {
  const { janela } = await abrirJanela('V4', versoes(true))
  digitar(janela, '5')
  expect(janela.getByText('A V4 foi aprovada, e o E-protocolo cita esse número.')).toBeTruthy()
})

test('mais de um aviso aparecem juntos, numa só janela', async () => {
  const { janela } = await abrirJanela('V4', versoes(true))
  digitar(janela, '7')
  expect(janela.getByText('A V7 ficará depois da V3, sem a V6.')).toBeTruthy()
  expect(janela.getByText('A V4 foi aprovada, e o E-protocolo cita esse número.')).toBeTruthy()
  expect(janela.getAllByText('Gravar assim mesmo?')).toHaveLength(1)
  expect(screen.getAllByRole('dialog', { name: /^Editar número/ })).toHaveLength(1)
})

test('[Gravar] grava com os avisos à vista, sem segunda janela', async () => {
  const { janela, secao } = await abrirJanela('V4')
  digitar(janela, '6')
  expect(janela.getByText('A V6 ficará depois da V3, sem a V5.')).toBeTruthy()
  expect(gravar(janela).disabled).toBe(false)
  fireEvent.click(gravar(janela))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar número da V4' })).toBeNull())
  expect(await secao.findByRole('article', { name: 'V6' })).toBeTruthy()
})
