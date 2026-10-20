// Situação de cada fase do Regimento (I a VII) de um processo, calculada só do catálogo ativo e dos andamentos dele
// (exportacao-e-manutencao, ticket 03; sabatina, decisão 5). Arquivo puro, testado no Vitest.
// As fases I a III foram feitas fora da plataforma para todos os setores: saem sempre concluídas. As VIII e IX ficam
// fora das planilhas enquanto não houver etapa nelas.
import type { AndamentoDoPacote, EtapaDoPacote, StatusDaEtapa } from './planilhasPacote.ts'

export const FASES_DA_PLANILHA = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const
export type FaseDaPlanilha = (typeof FASES_DA_PLANILHA)[number]
export type SituacaoDaFase =
  | 'Concluída'
  | 'Em andamento'
  | 'Pronto para iniciar'
  | 'Aguardando etapa anterior'
  | 'Dispensada'
  | 'Sem etapa'

export interface FaseDoProcesso {
  fase: FaseDaPlanilha
  situacao: SituacaoDaFase
  /** Dia em que a fase foi concluída (AAAA-MM-DD); nulo se não está concluída ou se nenhuma etapa trouxe a data. */
  concluidaEm: string | null
}

const FASES_DAS_ETAPAS: FaseDaPlanilha[] = ['IV', 'V', 'VI', 'VII']
const RESOLVIDAS: StatusDaEtapa[] = ['concluida', 'realizada_anteriormente', 'dispensada']
// Etapa que o processo ainda não recebeu (catálogo mexido depois) conta como pendente.
const SEM_ANDAMENTO = { status: 'pendente', resolvida_em: null } as const

type EtapaDoProcesso = Pick<AndamentoDoPacote, 'status' | 'resolvida_em'>

const resolvida = (etapa: EtapaDoProcesso): boolean => RESOLVIDAS.includes(etapa.status)
const comecou = (etapa: EtapaDoProcesso): boolean => etapa.status === 'em_andamento' || resolvida(etapa)

// Só a Publicação tem a exceção: dispensada, ela não conta como publicada.
function todasResolvidas(fase: FaseDaPlanilha, etapas: EtapaDoProcesso[]): SituacaoDaFase {
  const todasDispensadas = etapas.every((etapa) => etapa.status === 'dispensada')
  return fase === 'VII' && todasDispensadas ? 'Dispensada' : 'Concluída'
}

function situacaoDaFase(fase: FaseDaPlanilha, etapas: EtapaDoProcesso[], anteriorConcluida: boolean): SituacaoDaFase {
  if (etapas.length === 0) return 'Sem etapa'
  if (etapas.every(resolvida)) return todasResolvidas(fase, etapas)
  if (etapas.some(comecou)) return 'Em andamento'
  return anteriorConcluida ? 'Pronto para iniciar' : 'Aguardando etapa anterior'
}

function dataDeConclusao(etapas: EtapaDoProcesso[]): string | null {
  const datas = etapas.map((etapa) => etapa.resolvida_em).filter((data): data is string => data !== null)
  return datas.length > 0 ? datas.reduce((maior, data) => (data > maior ? data : maior)) : null
}

/** `etapas` é o catálogo ativo; `andamentos`, os de um único processo. */
export function situacaoDasFases(etapas: EtapaDoPacote[], andamentos: AndamentoDoPacote[]): FaseDoProcesso[] {
  const porEtapa = new Map(andamentos.map((andamento) => [andamento.etapa_id, andamento]))
  const iniciais: FaseDoProcesso[] = ['I', 'II', 'III'].map((fase) => ({
    fase: fase as FaseDaPlanilha,
    situacao: 'Concluída',
    concluidaEm: null,
  }))
  const resultado = [...iniciais]
  for (const fase of FASES_DAS_ETAPAS) {
    const daFase = etapas.filter((etapa) => etapa.fase === fase).map((etapa) => porEtapa.get(etapa.id) ?? SEM_ANDAMENTO)
    const situacao = situacaoDaFase(fase, daFase, resultado[resultado.length - 1].situacao === 'Concluída')
    resultado.push({ fase, situacao, concluidaEm: situacao === 'Concluída' ? dataDeConclusao(daFase) : null })
  }
  return resultado
}
