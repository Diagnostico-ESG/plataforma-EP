// Situação de cada fase do Regimento (I a VII) de um processo, pela posição dele no catálogo ativo e pelas passagens
// (exportacao-e-manutencao, ticket 06; spec, "Andamento livre"). Arquivo puro, testado no Vitest.
// As fases I a III foram feitas fora da plataforma para todos os setores: saem sempre concluídas. As VIII e IX ficam
// fora das planilhas enquanto não houver etapa nelas.
import { diaDeBrasilia } from './planilhasFuso.ts'
import type { EtapaDoPacote, PassagemDoPacote, ProcessoDoPacote } from './planilhasPacote.ts'

export const FASES_DA_PLANILHA = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const
export type FaseDaPlanilha = (typeof FASES_DA_PLANILHA)[number]
export type SituacaoDaFase = 'Concluída' | 'Em andamento' | 'Não iniciada' | 'Sem publicação' | 'Sem etapa'

export interface FaseDoProcesso {
  fase: FaseDaPlanilha
  situacao: SituacaoDaFase
  /** Dia em que a fase passou a contar como concluída (AAAA-MM-DD); nulo se não está concluída ou sem a data. */
  concluidaEm: string | null
}

const FASES_DAS_ETAPAS: FaseDaPlanilha[] = ['IV', 'V', 'VI', 'VII']

interface Contexto {
  etapas: EtapaDoPacote[]
  porId: Map<string, EtapaDoPacote>
  processo: ProcessoDoPacote
  passagens: PassagemDoPacote[]
  /** A etapa da passagem aberta; ausente se ela não está no catálogo ativo do pacote. */
  atual: EtapaDoPacote | undefined
}

// A última etapa da fase é a de maior ordem entre as dela.
function ultimaEtapaDaFase(etapas: EtapaDoPacote[], fase: FaseDaPlanilha): EtapaDoPacote | undefined {
  return etapas
    .filter((etapa) => etapa.fase === fase)
    .reduce<EtapaDoPacote | undefined>((ultima, etapa) => (!ultima || etapa.ordem > ultima.ordem ? etapa : ultima), undefined)
}

function situacaoDaFase(fase: FaseDaPlanilha, ultima: EtapaDoPacote | undefined, contexto: Contexto): SituacaoDaFase {
  const { atual, processo } = contexto
  if (!ultima) return 'Sem etapa'
  if (!atual) return 'Não iniciada'
  const depois = atual.ordem > ultima.ordem
  if (depois || (atual.id === ultima.id && processo.etiqueta === 'concluido')) {
    // A VII só conclui com a data da publicação: sem ela, o processo concluído não infla os publicados.
    return fase === 'VII' && processo.publicado_em === null ? 'Sem publicação' : 'Concluída'
  }
  return atual.fase === fase ? 'Em andamento' : 'Não iniciada'
}

// Percorre as passagens da mais recente para a mais antiga enquanto a fase contava como concluída; o início da
// sequência é a data. Uma passagem depois da fase conta desde a entrada; a da última etapa da fase conta desde o
// Concluído (a sequência começa ali). Assim, quem concluiu e seguiu em frente mantém a data, e quem voltou e concluiu
// de novo vale a mais recente.
function inicioDaConclusao(ultima: EtapaDoPacote, { passagens, porId }: Contexto): string | null {
  const recentesPrimeiro = [...passagens].sort((a, b) => Date.parse(b.entrou_em) - Date.parse(a.entrou_em))
  let inicio: string | null = null
  for (const passagem of recentesPrimeiro) {
    const etapa = porId.get(passagem.etapa_id)
    if (etapa && etapa.ordem > ultima.ordem) {
      inicio = passagem.entrou_em
      continue
    }
    if (etapa?.id === ultima.id && passagem.concluido_em) inicio = passagem.concluido_em
    break
  }
  return inicio === null ? null : diaDeBrasilia(inicio)
}

function dataDeConclusao(fase: FaseDaPlanilha, ultima: EtapaDoPacote | undefined, contexto: Contexto): string | null {
  if (!ultima) return null
  return fase === 'VII' ? contexto.processo.publicado_em : inicioDaConclusao(ultima, contexto)
}

function faseDoProcesso(fase: FaseDaPlanilha, contexto: Contexto): FaseDoProcesso {
  const ultima = ultimaEtapaDaFase(contexto.etapas, fase)
  const situacao = situacaoDaFase(fase, ultima, contexto)
  return { fase, situacao, concluidaEm: situacao === 'Concluída' ? dataDeConclusao(fase, ultima, contexto) : null }
}

/** `etapas` é o catálogo ativo; `passagens`, as de um único processo. */
export function situacaoDasFases(
  etapas: EtapaDoPacote[],
  processo: ProcessoDoPacote,
  passagens: PassagemDoPacote[],
): FaseDoProcesso[] {
  const porId = new Map(etapas.map((etapa) => [etapa.id, etapa]))
  const contexto: Contexto = { etapas, porId, processo, passagens, atual: porId.get(processo.etapa_atual_id) }
  const iniciais = (['I', 'II', 'III'] as const).map((fase): FaseDoProcesso => ({ fase, situacao: 'Concluída', concluidaEm: null }))
  return [...iniciais, ...FASES_DAS_ETAPAS.map((fase) => faseDoProcesso(fase, contexto))]
}
