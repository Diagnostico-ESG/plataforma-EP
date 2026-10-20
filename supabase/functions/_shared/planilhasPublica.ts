// As duas abas da planilha pública (exportacao-e-manutencao, ticket 03; spec, histórias 24 a 27): só contagens, sem nome
// de processo, de setor nem de pessoa, e sem identificador. A porcentagem se calcula no dashboard. Arquivo puro,
// testado no Vitest.
import { FASES_DA_PLANILHA } from './planilhasFases.ts'
import type { AbaDeValores, PacoteDasPlanilhas } from './planilhasPacote.ts'
import { analisarProcessos, type ProcessoAnalisado } from './planilhasProcesso.ts'

const FUSO_DO_ESCRITORIO = 'America/Sao_Paulo'

// O formato sueco é AAAA-MM-DD HH:MM; h23 evita "24:00" na meia-noite.
const FORMATO_DA_ATUALIZACAO = new Intl.DateTimeFormat('sv-SE', {
  timeZone: FUSO_DO_ESCRITORIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function dataEHoraDeBrasilia(instanteIso: string): string {
  return FORMATO_DA_ATUALIZACAO.format(new Date(instanteIso))
}

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
