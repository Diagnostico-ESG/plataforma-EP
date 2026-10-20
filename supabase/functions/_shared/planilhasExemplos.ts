// Pacotes inventados para os testes das planilhas (nenhum dado real). Só os testes importam este arquivo.
import type {
  AndamentoDoPacote,
  EtapaDoPacote,
  PacoteDasPlanilhas,
  ProcessoDoPacote,
  StatusDaEtapa,
} from './planilhasPacote.ts'

export function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

const CATALOGO: [string, EtapaDoPacote['fase']][] = [
  ['modelagem', 'IV'],
  ['relatorio_modelagem_tecnica', 'V'],
  ['revisao_interna', 'VI'],
  ['revisao_setor', 'VI'],
  ['aprovacao_setor', 'VI'],
  ['publicacao', 'VII'],
]

export function etapasDoCatalogo(): EtapaDoPacote[] {
  return CATALOGO.map(([codigo, fase], i) => ({ id: uuid(100 + i), codigo, ordem: i + 1, fase }))
}

export function processoDe(n: number, campos: Partial<ProcessoDoPacote> = {}): ProcessoDoPacote {
  return {
    id: uuid(n),
    nome: `Processo ${n}`,
    tipo: 'processo',
    setor_sigla: 'SET',
    macroprocesso_nome: 'Macro Inventado',
    situacao_guardada: 'em_andamento',
    concluido: false,
    observacoes: null,
    data_da_reuniao: null,
    ultima_versao: null,
    ...campos,
  }
}

export interface Marca {
  status: StatusDaEtapa
  iniciada_em?: string | null
  resolvida_em?: string | null
}

/** Um andamento por etapa do catálogo; o que não está em `marcas` fica pendente. */
export function andamentosDe(
  processo: ProcessoDoPacote,
  marcas: Record<string, StatusDaEtapa | Marca>,
  etapas: EtapaDoPacote[] = etapasDoCatalogo(),
): AndamentoDoPacote[] {
  return etapas.map((etapa) => {
    const marca = marcas[etapa.codigo] ?? 'pendente'
    const { status, iniciada_em = null, resolvida_em = null } = typeof marca === 'string' ? { status: marca } : marca
    return { processo_id: processo.id, etapa_id: etapa.id, status, iniciada_em, resolvida_em }
  })
}

export function pacoteDe(
  processos: ProcessoDoPacote[],
  andamentos: AndamentoDoPacote[],
  etapas: EtapaDoPacote[] = etapasDoCatalogo(),
): PacoteDasPlanilhas {
  return {
    tentativa: uuid(1),
    ficha: 'a'.repeat(64),
    gerado_em: '2026-10-20T12:00:00Z',
    planilhas: { interna: 'id-da-planilha-interna', publica: 'id-da-planilha-publica' },
    etapas,
    processos,
    andamentos,
  }
}

/** Um pacote pequeno e válido: um processo com a Modelagem piloto em andamento. */
export function pacoteMinimo(): PacoteDasPlanilhas {
  const processo = processoDe(10)
  return pacoteDe([processo], andamentosDe(processo, { modelagem: 'em_andamento' }))
}
