import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { ProcessosFalso } from './processos/ProcessosFalso'
import type { ProcessoLido } from './processos/tipos'
import { ETAPAS_DE_TESTE, abrirCatalogo, montarComCatalogo } from './testes/catalogoDeTeste'
import { umProcessoLido } from './testes/processoDaLista'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

// O que o catálogo muda nos processos (ticket 25 de processos-etapas, Andamento livre): etapa nova só acrescenta uma coluna e
// uma linha na seção Etapas, sem mexer em nenhum processo; a etapa com processo dentro não se desativa.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const posicaoNoCatalogo = (codigo: string) => {
  const ativas = ETAPAS_DE_TESTE.filter((etapa) => etapa.ativa)
  const indice = ativas.findIndex((etapa) => etapa.codigo === codigo)
  const { id, nome, ordem } = ativas[indice]
  return { id, codigo, nome, ordem, posicao: indice + 1, total: ativas.length }
}

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return umProcessoLido(nome, { id, responsavel: null, etapaAtual: posicaoNoCatalogo('modelagem'), ...mudancas })
}

// O Quadro e o verso leem o catálogo de processos que o falso mantém a cada gravação no catálogo.
function montar(): ProcessosFalso {
  return montarComCatalogo({ ajustar: (processos) => {
    processos.processos = [processo('p-andando', 'Andando'), processo('p-pronto', 'Pronto', { situacao: 'concluido', etapaAtual: posicaoNoCatalogo('concluidos') })]
  } })
}

// Volta a abrir o aplicativo no endereço pedido, com o mesmo falso (o que foi gravado continua lá).
function abrirEm(processos: ProcessosFalso, endereco: string) {
  cleanup()
  window.location.hash = endereco
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' })} cadastros={new CadastrosFalso()} processos={processos} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
}

async function acrescentarEncerramento() {
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Nova etapa' }))
  const formulario = within(secao.getByRole('form', { name: 'Nova etapa' }))
  fireEvent.change(formulario.getByLabelText('Nome'), { target: { value: 'Encerramento' } })
  fireEvent.change(formulario.getByLabelText('Código'), { target: { value: 'encerramento' } })
  fireEvent.change(formulario.getByLabelText('Fase do Regimento'), { target: { value: 'VI' } })
  fireEvent.click(formulario.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Nova etapa' })).toBeNull())
}

async function etapasDoVerso(): Promise<string[]> {
  const lista = within(await screen.findByRole('region', { name: 'Etapas' }))
  return lista.getAllByRole('listitem').map((item) => item.querySelector('.etapa-nome')?.textContent ?? '')
}

test('etapa nova vira coluna do Quadro, entre as fixas, sem mudar a etapa de nenhum processo', async () => {
  const processos = montar()
  await acrescentarEncerramento()
  abrirEm(processos, '#/processos')
  await screen.findByRole('region', { name: 'Encerramento' })
  const colunas = screen.getAllByRole('region').map((regiao) => regiao.getAttribute('aria-label'))
  const titulos = colunas.filter((titulo) => titulo !== 'Processos')
  expect(titulos).toContain('Encerramento')
  expect(titulos.at(0)).toBe('Não iniciados')
  expect(titulos.at(-1)).toBe('Concluídos')
  expect(titulos.indexOf('Encerramento')).toBe(titulos.length - 2)
  expect(processos.processos.map((p) => p.etapaAtual?.codigo)).toEqual(['modelagem', 'concluidos'])
})

test('etapa nova aparece na seção Etapas dos processos, em andamento ou concluídos, nunca visitada', async () => {
  const processos = montar()
  await acrescentarEncerramento()
  abrirEm(processos, '#/processos/p-andando')
  expect(await etapasDoVerso()).toContain('Encerramento')
  abrirEm(processos, '#/processos/p-pronto')
  expect(await etapasDoVerso()).toContain('Encerramento')
})

test('a etapa com processo dentro não se desativa: a recusa traz a contagem e a coluna continua no Quadro', async () => {
  const processos = montar()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Divulgação' }))
  await waitFor(() => expect(processos.etapasDoCatalogo.find((outra) => outra.codigo === 'divulgacao')?.ativa).toBe(false))
  processos.processos = [processo('p-andando', 'Andando', { etapaAtual: posicaoNoCatalogo('divulgacao') })]
  fireEvent.click(secao.getByRole('button', { name: 'Reativar Divulgação' }))
  await waitFor(() => expect(processos.etapasDoCatalogo.find((outra) => outra.codigo === 'divulgacao')?.ativa).toBe(true))
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Divulgação' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A etapa Divulgação tem 1 processo; mova-o antes de desativar.')
  abrirEm(processos, '#/processos')
  expect(await screen.findByRole('region', { name: 'Divulgação' })).toBeTruthy()
})

test('a etapa desativada sem processo some do Quadro e volta ao ser reativada, sem mexer em nenhum processo', async () => {
  const processos = montar()
  const secao = await abrirCatalogo()
  fireEvent.click(await secao.findByRole('button', { name: 'Desativar Divulgação' }))
  await waitFor(() => expect(processos.etapasDoCatalogo.find((outra) => outra.codigo === 'divulgacao')?.ativa).toBe(false))
  abrirEm(processos, '#/processos')
  await screen.findAllByRole('region')
  expect(screen.queryByRole('region', { name: 'Divulgação' })).toBeNull()
  expect(processos.processos.map((p) => p.etapaAtual?.codigo)).toEqual(['modelagem', 'concluidos'])
})
