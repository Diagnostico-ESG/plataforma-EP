import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { SituacaoDoProcesso } from './processos/tipos'
import { montarNosCadastros } from './testes/processosNosCadastros'
import { versaoDeTeste } from './testes/versoesDeTeste'
import { escolherNoMenu, janelaPorCima } from './testes/versoDoCartao'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const historicaDeTeste = (numero: number) => versaoDeTeste(numero, {
  historica: true, etapa: null,
  arquivos: [{ id: `h${numero}`, papel: 'bpm', nome: `TSA_V${numero}F_Emitir Ofício.bpm`, formato: 'bpm', tamanho: 10 }],
})

/** V2F (histórica), V3 e V4 (em sequência). */
const COM_VERSOES = {
  ajustarVersoes: (falso: VersoesFalso) => { falso.versoes.p1 = [historicaDeTeste(2), versaoDeTeste(3), versaoDeTeste(4)] },
}

async function secaoDeVersoes() {
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await painel.findByRole('region', { name: 'Arquivos' }))
}

async function abrirJanela(rotulo = 'V4', montagem: Parameters<typeof montarNosCadastros>[0] = COM_VERSOES) {
  const falso = montarNosCadastros(montagem)
  const secao = await secaoDeVersoes()
  if (rotulo !== 'V4') fireEvent.click(await secao.findByText(/Versões anteriores/))
  await escolherNoMenu(`Ações da ${rotulo}`, 'Editar número')
  const janela = within(await screen.findByRole('dialog', { name: `Editar número da ${rotulo}` }))
  return { ...falso, secao, janela }
}

type Janela = Awaited<ReturnType<typeof abrirJanela>>['janela']
const campo = (janela: Janela) => janela.getByLabelText('Número da versão') as HTMLInputElement
const gravar = (janela: Janela) => janela.getByRole('button', { name: /^(Gravar|Salvando…)$/ }) as HTMLButtonElement
const digitar = (janela: Janela, texto: string) => fireEvent.change(campo(janela), { target: { value: texto } })

test.each(['administrador', 'integrante_ep'] as const)('o %s vê o ⋯ ao lado do rótulo, no destaque e nas versões anteriores', async (perfil) => {
  montarNosCadastros({ ...COM_VERSOES, perfil })
  const secao = await secaoDeVersoes()
  const destaque = within(await secao.findByRole('article', { name: 'V4' }))
  expect(destaque.getByRole('button', { name: 'Ações da V4' })).toBeTruthy()
  fireEvent.click(secao.getByText(/Versões anteriores/))
  for (const rotulo of ['V3', 'V2F']) {
    expect(within(secao.getByRole('article', { name: rotulo })).getByRole('button', { name: `Ações da ${rotulo}` })).toBeTruthy()
  }
})

test('a Consulta vê as versões sem o ⋯', async () => {
  montarNosCadastros({ ...COM_VERSOES, perfil: 'consulta' })
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V4' })
  expect(secao.queryByRole('button', { name: /^Ações da/ })).toBeNull()
})

test.each(['suspenso', 'cancelado', 'concluido'] as const)('processo %s não tem o ⋯', async (situacao: SituacaoDoProcesso) => {
  montarNosCadastros({
    ...COM_VERSOES,
    ajustarProcessos: (falso) => {
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, situacao } : processo))
    },
  })
  const secao = await secaoDeVersoes()
  await secao.findByRole('article', { name: 'V4' })
  expect(secao.queryByRole('button', { name: /^Ações da/ })).toBeNull()
})

test('a janela abre com o número atual, [Gravar] desabilitado, e a prévia mostra o rótulo e os nomes novos', async () => {
  const { janela } = await abrirJanela()
  expect(campo(janela).value).toBe('4')
  expect(gravar(janela).disabled).toBe(true)
  digitar(janela, '6')
  expect(gravar(janela).disabled).toBe(false)
  expect(janela.getByText('V6', { selector: 'strong' })).toBeTruthy()
  expect(janela.getByRole('list', { name: 'Nomes novos dos arquivos' }).textContent).toContain('TSA_V6_Emitir Ofício.bpm')
})

test.each(['0', 'abc', '4', '-1', '2,5'])('o número "%s" mantém o [Gravar] desabilitado', async (texto) => {
  const { janela } = await abrirJanela()
  digitar(janela, texto)
  expect(gravar(janela).disabled).toBe(true)
})

test('a prévia da histórica mantém a letra F', async () => {
  const { janela } = await abrirJanela('V2F')
  digitar(janela, '1')
  expect(janela.getByText('V1F', { selector: 'strong' })).toBeTruthy()
  expect(janela.getByRole('list', { name: 'Nomes novos dos arquivos' }).textContent).toContain('TSA_V1F_Emitir Ofício.bpm')
})

test('gravar mostra "Renomeando os arquivos no Drive…" com o campo travado e, ao terminar, fecha e relê as versões', async () => {
  const { janela, versoes, secao } = await abrirJanela()
  let terminar = () => {}
  versoes.editarNumero = async (id, esperado, novo) => {
    await new Promise<void>((resolver) => { terminar = resolver })
    await Object.getPrototypeOf(versoes).editarNumero.call(versoes, id, esperado, novo)
  }
  digitar(janela, '6')
  fireEvent.click(gravar(janela))
  expect(await janela.findByText('Renomeando os arquivos no Drive…')).toBeTruthy()
  // O campo está dentro de um fieldset desabilitado: a propriedade do campo continua falsa, mas ele não aceita edição.
  expect(campo(janela).matches(':disabled')).toBe(true)
  terminar()
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar número da V4' })).toBeNull())
  expect(await secao.findByRole('article', { name: 'V6' })).toBeTruthy()
  expect(secao.queryByRole('article', { name: 'V4' })).toBeNull()
})

test('o número de outra versão é recusado com a frase, a janela fica aberta e o número digitado continua', async () => {
  const { janela } = await abrirJanela()
  digitar(janela, '3')
  fireEvent.click(gravar(janela))
  expect((await janela.findByRole('alert')).textContent).toBe('Este processo já tem a V3.')
  expect(campo(janela).value).toBe('3')
  expect(gravar(janela).disabled).toBe(false)
})

test('a falha do Drive diz que a versão continua como era, e nada muda', async () => {
  const { janela, versoes, secao } = await abrirJanela()
  versoes.falharNaRenomeacao = new TravaDoBanco('Os arquivos não puderam ser renomeados no Drive; a versão continua V4.')
  digitar(janela, '6')
  fireEvent.click(gravar(janela))
  expect((await janela.findByRole('alert')).textContent).toBe('Os arquivos não puderam ser renomeados no Drive; a versão continua V4.')
  expect(campo(janela).value).toBe('6')
  expect(versoes.versoes.p1.find((versao) => versao.id === 'v4')?.numero).toBe(4)
  expect(janelaPorCima()).toBe(janela.getByRole('alert').closest('dialog'))
  expect(secao.getByRole('article', { name: 'V4' })).toBeTruthy()
})

test('falha de conexão usa a frase de erro de gravação de sempre, com o número digitado mantido', async () => {
  const { janela, versoes } = await abrirJanela()
  versoes.falhaNoRegistro = 'sem conexão'
  digitar(janela, '6')
  fireEvent.click(gravar(janela))
  expect((await janela.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(campo(janela).value).toBe('6')
})

test('Cancelar fecha a janela sem gravar', async () => {
  const { janela, versoes } = await abrirJanela()
  digitar(janela, '6')
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar número da V4' })).toBeNull())
  expect(versoes.versoes.p1.find((versao) => versao.id === 'v4')?.numero).toBe(4)
})
