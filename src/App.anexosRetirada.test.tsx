import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Perfil } from './acesso/tipos'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { anexoDeTeste, secaoDeAnexos } from './testes/anexosDeTeste'
import { montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import { escolherNoMenuDoProcesso } from './testes/versoDoCartao'
import { arquivoDeTeste, relatorioNumeradoDeTeste, versaoDeTeste } from './testes/versoesDeTeste'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
  URL.createObjectURL = vi.fn(() => 'blob:arquivo')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.location.hash = ''
})

const FRASE_DA_LIXEIRA = 'O arquivo vai para a lixeira do Drive e some em 30 dias.'

const comAnexos = (...anexos: ReturnType<typeof anexoDeTeste>[]) => ({
  ajustarProcessos: naEtapa('modelagem'),
  ajustarVersoes: (falso: VersoesFalso) => { falso.anexos.anexos.p1 = anexos },
})
const resposta = () => anexoDeTeste(1, 'resposta.eml')

async function pedirRetirada(nome = 'resposta.eml', indice = 0) {
  const secao = await secaoDeAnexos()
  const botoes = await secao.findAllByRole('button', { name: `Retirar ${nome}` })
  fireEvent.click(botoes[indice])
  return { secao, janela: within(await screen.findByRole('dialog', { name: `Retirar '${nome}'?` })) }
}

test.each<Perfil>(['administrador', 'integrante_ep'])('%s vê [Retirar] em cada anexo, com o processo em andamento', async (perfil) => {
  montarNosCadastros({ ...comAnexos(resposta(), anexoDeTeste(2, 'planilha.xlsx')), perfil })
  const secao = await secaoDeAnexos()
  expect(await secao.findByRole('button', { name: 'Retirar resposta.eml' })).toBeTruthy()
  expect(secao.getByRole('button', { name: 'Retirar planilha.xlsx' })).toBeTruthy()
})

test('a confirmação mostra o nome do arquivo e a frase da lixeira, com o foco no Cancelar', async () => {
  montarNosCadastros(comAnexos(resposta()))
  const { janela } = await pedirRetirada()
  expect(janela.getByText(FRASE_DA_LIXEIRA)).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Retirar' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('confirmar retira o anexo: a linha some, a função recebe o identificador e a lista fica vazia', async () => {
  const { versoes } = montarNosCadastros(comAnexos(resposta()))
  const { secao, janela } = await pedirRetirada()
  fireEvent.click(janela.getByRole('button', { name: 'Retirar' }))
  expect(await secao.findByText('Nenhum anexo.')).toBeTruthy()
  expect(secao.queryByText('resposta.eml')).toBeNull()
  expect(versoes.anexos.retiradas).toEqual(['an1'])
})

test('cancelar a confirmação não muda nada', async () => {
  const { versoes } = montarNosCadastros(comAnexos(resposta()))
  const { secao, janela } = await pedirRetirada()
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  expect(secao.getByText('resposta.eml')).toBeTruthy()
  expect(secao.queryByRole('alert')).toBeNull()
  expect(versoes.anexos.retiradas).toEqual([])
})

test('se a retirada falha, o anexo continua na lista e a frase aparece em vermelho', async () => {
  const { versoes } = montarNosCadastros(comAnexos(resposta()))
  versoes.anexos.falhaNaRetirada = 'Drive fora do ar'
  const { secao, janela } = await pedirRetirada()
  fireEvent.click(janela.getByRole('button', { name: 'Retirar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('Não foi possível retirar o anexo: Drive fora do ar.')
  expect(secao.getByText('resposta.eml')).toBeTruthy()
})

test('a recusa pronta do servidor aparece como está, e a próxima tentativa limpa o aviso', async () => {
  const { versoes } = montarNosCadastros(comAnexos(resposta()))
  versoes.anexos.falhaNaRetirada = new TravaDoBanco('O processo não está em andamento; não é possível retirar anexo.')
  const { secao, janela } = await pedirRetirada()
  fireEvent.click(janela.getByRole('button', { name: 'Retirar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('O processo não está em andamento; não é possível retirar anexo.')
  versoes.anexos.falhaNaRetirada = null
  fireEvent.click((await pedirRetirada()).janela.getByRole('button', { name: 'Retirar' }))
  await waitFor(() => expect(secao.queryByRole('alert')).toBeNull())
  expect(await secao.findByText('Nenhum anexo.')).toBeTruthy()
})

test('anexo já retirado em outra aba: a frase aparece e a linha some da lista', async () => {
  const { versoes } = montarNosCadastros(comAnexos(resposta()))
  const { secao, janela } = await pedirRetirada()
  versoes.anexos.anexos.p1 = []
  fireEvent.click(janela.getByRole('button', { name: 'Retirar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('O anexo já foi retirado.')
  await waitFor(() => expect(secao.queryByText('resposta.eml')).toBeNull())
})

test('dois anexos de mesmo nome: retira só o escolhido, pelo identificador', async () => {
  const { versoes } = montarNosCadastros(comAnexos(anexoDeTeste(1, 'igual.eml'), anexoDeTeste(2, 'igual.eml')))
  const { secao, janela } = await pedirRetirada('igual.eml', 1)
  fireEvent.click(janela.getByRole('button', { name: 'Retirar' }))
  await waitFor(() => expect(secao.getAllByRole('listitem')).toHaveLength(1))
  expect(versoes.anexos.retiradas).toEqual(['an1'])
  expect(versoes.anexos.anexos.p1.map((anexo) => anexo.id)).toEqual(['an2'])
})

test('a retirada aparece no histórico do processo: "Retirou o anexo \'…\'"', async () => {
  montarNosCadastros(comAnexos(resposta()))
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  const { secao, janela } = await pedirRetirada()
  fireEvent.click(janela.getByRole('button', { name: 'Retirar' }))
  await secao.findByText('Nenhum anexo.')
  await escolherNoMenuDoProcesso('Histórico')
  expect(await painel.findByText("Retirou o anexo 'resposta.eml'")).toBeTruthy()
})

test('versão e relatório continuam sem retirada: só os anexos têm [Retirar]', async () => {
  montarNosCadastros({
    ...comAnexos(resposta()),
    ajustarVersoes: (falso: VersoesFalso) => {
      falso.anexos.anexos.p1 = [resposta()]
      falso.versoes.p1 = [versaoDeTeste(1, {
        arquivos: [...versaoDeTeste(1).arquivos, arquivoDeTeste(1, 'relatorio', 'docx'), relatorioNumeradoDeTeste(1, 1)],
      })]
    },
  })
  await secaoDeAnexos()
  const verso = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  await verso.findByRole('region', { name: 'Arquivos' })
  expect(verso.getAllByRole('button', { name: /^Retirar/ }).map((botao) => botao.getAttribute('aria-label')))
    .toEqual(['Retirar resposta.eml'])
})
