// As duas abas da planilha pública (exportacao-e-manutencao, ticket 03; spec, histórias 24 a 27): só contagens, sem nome
// de processo, de setor nem de pessoa, e sem identificador. A porcentagem se calcula no dashboard. Arquivo puro,
// testado no Vitest.
import { FASES_DA_PLANILHA } from './planilhasFases.ts'
import { dataEHoraDeBrasilia } from './planilhasFuso.ts'
import type { AbaDeValores, PacoteDasPlanilhas } from './planilhasPacote.ts'
import { analisarProcessos, type ProcessoAnalisado } from './planilhasProcesso.ts'

// Os testes da hora de Brasília importam a função daqui desde que ela foi para planilhasFuso.ts.
export { dataEHoraDeBrasilia }

function concluidosDaFase(processos: ProcessoAnalisado[], posicao: number): number {
  return processos.filter(({ fases }) => fases[posicao].situacao === 'Concluída').length
}

export function montarPlanilhaPublica(pacote: PacoteDasPlanilhas): AbaDeValores[] {
  const processos = analisarProcessos(pacote)
  const setores = new Set(processos.map(({ processo }) => processo.setor_sigla))
  const resumo = [processos.length, setores.size, dataEHoraDeBrasilia(pacote.gerado_em)]
  const porFase = FASES_DA_PLANILHA.map((fase, posicao) => [fase, concluidosDaFase(processos, posicao), processos.length])
  return [
    { titulo: 'Resumo', linhas: [['Total de processos', 'Total de setores', 'Atualizado em'], resumo] },
    { titulo: 'Fases', linhas: [['Fase', 'Concluídos', 'Total'], ...porFase] },
  ]
}
