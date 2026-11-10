import { expect, test } from 'vitest'
import { type ParteDaLinha, csvDaPlanilha, linhaDaPlanilha } from '../testes/planilhaDeTeste'
import { lacunasDaPasta } from './lacunasDaPasta'
import { lerPasta } from './lerPasta'
import { lerPlanilha } from './lerPlanilha'

// O relatório das lacunas (história 48c): buracos na numeração da pasta e a diferença entre a pasta e as colunas V1 a V8.
const HOJE = new Date(2026, 10, 9, 12)

function planilha(...linhas: ParteDaLinha[]) {
  return lerPlanilha(csvDaPlanilha(linhas.map(linhaDaPlanilha)), HOJE)
}

function pasta(...nomes: string[]) {
  return lerPasta(nomes.map((nome) => ({ caminho: `D/XYZ/${nome}`, arquivo: new File(['x'], nome) })))
}

test('V1 e V3 sem V2 é um buraco, contando também a versão sem .bpm', () => {
  const lacunas = lacunasDaPasta(pasta('XYZ_V1_Exemplo Alfa.bpm', 'XYZ_V3_Exemplo Alfa_Relatório.docx', 'XYZ_V5_Exemplo Alfa.bpm'),
    planilha({ v: [1, 3, 5] }))
  expect(lacunas.buracos).toEqual([{ chave: 'XYZ|exemplo alfa', nomeDoProcesso: 'Exemplo Alfa', faltam: [2, 4] }])
})

test('a versão da pasta sem "x" na planilha, e o "x" da planilha sem arquivo na pasta', () => {
  const lacunas = lacunasDaPasta(pasta('XYZ_V1_Exemplo Alfa.bpm', 'XYZ_V4_Exemplo Alfa.bpm'),
    planilha({ v: [1, 2] }, { nome: 'Exemplo Beta', v: [1] }))
  expect(lacunas.soNaPasta).toEqual([{ chave: 'XYZ|exemplo alfa', nomeDoProcesso: 'Exemplo Alfa', numero: 4 }])
  expect(lacunas.soNaPlanilha).toEqual([
    { chave: 'XYZ|exemplo alfa', nomeDoProcesso: 'Exemplo Alfa', numero: 2 },
    { chave: 'XYZ|exemplo beta', nomeDoProcesso: 'Exemplo Beta', numero: 1 },
  ])
})

test('pasta e planilha iguais não dão lacuna', () => {
  const lacunas = lacunasDaPasta(pasta('XYZ_V1F_Exemplo Alfa.bpm', 'XYZ_V2_Exemplo Alfa.bpm'), planilha({ v: [1, 2] }))
  expect(lacunas).toEqual({ buracos: [], soNaPasta: [], soNaPlanilha: [] })
})
