export type ResultadoDaRevisao = 'sem_alteracao' | 'corrigida'
export type EscopoDaCorrecao = 'fluxograma' | 'relatorio' | 'ambos'

/** O que a janela de concluir a Revisão interna grava: o escopo só vale em "corrigida"; o comentário vem aparado (null: sem). */
export type DadosDaRevisao = { resultado: ResultadoDaRevisao; escopo: EscopoDaCorrecao | null; comentario: string | null }

/** Uma revisão registrada; as versões são os números (V7, V8) e `revisadaEm` é a data AAAA-MM-DD. */
export type RevisaoInterna = {
  id: string
  versaoRevisada: number
  /** Só em "corrigida": a versão que o revisor enviou como correção. */
  versaoCorrigida: number | null
  resultado: ResultadoDaRevisao
  escopo: EscopoDaCorrecao | null
  comentario: string | null
  /** Nome de quem revisou; null se o usuário não puder ser lido. */
  revisor: string | null
  revisadaEm: string
}

/**
 * Único ponto por onde a interface fala com o banco nas revisões. Recusa do banco chega como TravaDoBanco, com a frase
 * pronta; outra falha, como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeRevisoes = {
  /** As revisões do processo, da mais recente para a mais antiga. */
  listarRevisoes(processoId: string): Promise<RevisaoInterna[]>
  /**
   * Grava a revisão e conclui a Revisão interna numa gravação só (a próxima etapa pendente entra em andamento com o
   * responsável; null: ninguém). Se a conclusão falha, a revisão não fica.
   */
  concluirRevisaoInterna(andamentoId: string, dados: DadosDaRevisao, proximoResponsavelId: string | null): Promise<void>
}
