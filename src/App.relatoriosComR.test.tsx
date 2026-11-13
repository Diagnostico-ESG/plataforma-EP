import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ImportacaoFalso } from './importacao/ImportacaoFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

// Relatório numerado com R (documentos-versoes, mudança de 2026-11-13; ADR 0047): a seção "3. Relatórios com R" da aba
// Importação, em cada estado, com o falso da importação. Nomes inventados.

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ADMINISTRADOR = { ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil }

function relatorios(quantos: number) {
  return Array.from({ length: quantos }, (_, i) => ({ arquivoId: `rel-${i + 1}`, nome: `XYZ_V${i + 2}_Exemplo_Relatório V${i + 1}.docx` }))
}

function montar(importacao: ImportacaoFalso) {
  render(<App acesso={AcessoFalso.logadoComo(ADMINISTRADOR)} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()}
    versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} importacao={importacao} />)
}

async function secao() {
  fireEvent.click(await screen.findByRole('tab', { name: 'Importação' }))
  return within(await screen.findByRole('region', { name: '3. Relatórios com R' }))
}

function comRelatorios(quantos: number, foraDoPadrao = 0): ImportacaoFalso {
  const importacao = new ImportacaoFalso()
  importacao.relatoriosComV = relatorios(quantos)
  importacao.relatoriosForaDoPadrao = foraDoPadrao
  return importacao
}

test('ao abrir, procura os relatórios com V no nome', async () => {
  const importacao = comRelatorios(2)
  importacao.segurarALeituraDosRelatorios = true
  montar(importacao)
  expect(await (await secao()).findByText('Procurando relatórios com V no nome…')).toBeTruthy()
})

test('com relatórios a renomear, diz quantos e oferece [Renomear para R]', async () => {
  montar(comRelatorios(3))
  const area = await secao()
  expect(await area.findByText(
    '3 relatórios ainda têm V no nome do arquivo (Relatório V2). Renomear troca só a letra, no Drive e na plataforma.')).toBeTruthy()
  expect(area.getByRole('button', { name: 'Renomear para R' })).toBeTruthy()
  expect(area.queryByText(/fora do padrão/)).toBeNull()
})

test('com relatórios fora do padrão, diz quantos ficam como estão', async () => {
  montar(comRelatorios(1, 2))
  const area = await secao()
  expect(await area.findByText(
    '1 relatório ainda tem V no nome do arquivo (Relatório V2). Renomear troca só a letra, no Drive e na plataforma.')).toBeTruthy()
  expect(area.getByText('2 relatórios com nome fora do padrão ficam como estão.')).toBeTruthy()
})

test('renomeando, mostra o andamento sem o botão', async () => {
  const importacao = comRelatorios(3)
  importacao.segurarNoRelatorio = 'rel-2'
  montar(importacao)
  const area = await secao()
  fireEvent.click(await area.findByRole('button', { name: 'Renomear para R' }))
  expect(await area.findByText('Renomeando… 1 de 3.')).toBeTruthy()
  expect(area.queryByRole('button', { name: 'Renomear para R' })).toBeNull()
})

test('ao fim sem falhas, diz quantos foram renomeados', async () => {
  const importacao = comRelatorios(3)
  montar(importacao)
  const area = await secao()
  fireEvent.click(await area.findByRole('button', { name: 'Renomear para R' }))
  expect(await area.findByText('3 relatórios renomeados.')).toBeTruthy()
  expect(area.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(importacao.renomeados).toEqual(['rel-1', 'rel-2', 'rel-3'])
})

test('com falhas, os renomeados ficam e [Tentar de novo] continua só os que faltam', async () => {
  const importacao = comRelatorios(3)
  importacao.falharAoRenomear = ['rel-2']
  montar(importacao)
  const area = await secao()
  fireEvent.click(await area.findByRole('button', { name: 'Renomear para R' }))
  expect(await area.findByText('2 relatórios renomeados.')).toBeTruthy()
  expect(area.getByText('1 não foi renomeado. Tente de novo para continuar os que faltam.')).toBeTruthy()
  importacao.falharAoRenomear = []
  fireEvent.click(area.getByRole('button', { name: 'Tentar de novo' }))
  expect(await area.findByText('1 relatório renomeado.')).toBeTruthy()
  expect(importacao.renomeados).toEqual(['rel-1', 'rel-3', 'rel-2'])
})

test('sem nada a renomear, diz que todos já estão com R', async () => {
  montar(comRelatorios(0))
  expect(await (await secao()).findByText('Todos os relatórios numerados já estão com R.')).toBeTruthy()
})

test('erro na leitura mostra a frase e [Tentar de novo], que lê de novo', async () => {
  const importacao = comRelatorios(2)
  importacao.falharAoListarRelatorios = true
  montar(importacao)
  const area = await secao()
  expect(await area.findByText('Não foi possível ler os relatórios. Confira a conexão e tente de novo.')).toBeTruthy()
  importacao.falharAoListarRelatorios = false
  fireEvent.click(area.getByRole('button', { name: 'Tentar de novo' }))
  expect(await area.findByRole('button', { name: 'Renomear para R' })).toBeTruthy()
})
