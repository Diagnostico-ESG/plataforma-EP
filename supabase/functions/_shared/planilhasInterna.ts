// As duas abas da planilha interna (exportacao-e-manutencao, tickets 03 e 06; spec, histórias 9 a 23 e 56 a 63): Processos, uma linha por
// processo, e Fases, uma linha por processo e fase I a VII. Arquivo puro, testado no Vitest. Nenhum nome de pessoa
// entra: só os campos do pacote que a planilha precisa são lidos, um a um. Texto vai como texto (não como fórmula).
import type { AbaDeValores, PacoteDasPlanilhas } from './planilhasPacote.ts'
import {
  analisarProcessos,
  dataDaModelagemPiloto,
  dataDaPublicacao,
  rotuloDaVersao,
  rotuloDoProcesso,
  rotuloDoTipo,
  type ProcessoAnalisado,
} from './planilhasProcesso.ts'

const CABECALHO_DOS_PROCESSOS = [
  'Identificador', 'Área', 'Macroprocesso', 'Processo', 'Tipo', 'Situação',
  'Data da modelagem piloto', 'Data da publicação', 'Última versão', 'Observações',
]
const CABECALHO_DAS_FASES = ['Identificador', 'Área', 'Processo', 'Fase', 'Situação', 'Data de conclusão']

function linhaDoProcesso(analisado: ProcessoAnalisado, pacote: PacoteDasPlanilhas): (string | number)[] {
  const { processo, fases } = analisado
  return [
    processo.id,
    processo.setor_sigla,
    processo.macroprocesso_nome,
    processo.nome,
    rotuloDoTipo(processo.tipo),
    rotuloDoProcesso(processo, pacote.etapas),
    dataDaModelagemPiloto(processo, fases),
    dataDaPublicacao(processo),
    rotuloDaVersao(processo.ultima_versao),
    '', // Observações: a coluna fica para os painéis do Data Studio, mas a plataforma já não guarda o texto.
  ]
}

function linhasDasFases({ processo, fases }: ProcessoAnalisado): (string | number)[][] {
  return fases.map((fase) => [
    processo.id,
    processo.setor_sigla,
    processo.nome,
    fase.fase,
    fase.situacao,
    fase.concluidaEm ?? '',
  ])
}

export function montarPlanilhaInterna(pacote: PacoteDasPlanilhas): AbaDeValores[] {
  const processos = analisarProcessos(pacote)
  return [
    { titulo: 'Processos', linhas: [CABECALHO_DOS_PROCESSOS, ...processos.map((p) => linhaDoProcesso(p, pacote))] },
    { titulo: 'Fases', linhas: [CABECALHO_DAS_FASES, ...processos.flatMap(linhasDasFases)] },
  ]
}
