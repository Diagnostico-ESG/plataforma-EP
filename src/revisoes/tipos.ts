export type ResultadoDaRevisao = 'sem_alteracao' | 'corrigida'
export type EscopoDaCorrecao = 'fluxograma' | 'relatorio' | 'ambos'

/** O que a janela de concluir a Revisão interna grava: o escopo só vale em "corrigida"; o comentário vem aparado (null: sem). */
export type DadosDaRevisao = { resultado: ResultadoDaRevisao; escopo: EscopoDaCorrecao | null; comentario: string | null }

/** O que a janela de editar a revisão grava: o escopo só vale em "corrigida"; o comentário vem aparado (null: sem). */
export type DadosDaEdicaoDaRevisao = { escopo: EscopoDaCorrecao | null; comentario: string | null }

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
  /** A aprovação do processo; null quando ainda não há (ou foi desfeita pela volta de etapa). */
  lerAprovacao(processoId: string): Promise<Aprovacao | null>
  /**
   * Grava a aprovação e conclui a Aprovação pelo setor numa gravação só (a próxima etapa pendente, se houver, entra em
   * andamento com o responsável; null: ninguém). Se a conclusão falha, a aprovação não fica.
   */
  concluirAprovacao(andamentoId: string, dados: DadosDaAprovacao, proximoResponsavelId: string | null): Promise<void>
  /** Corrige o escopo (só na "corrigida") e o comentário de uma revisão; o banco confere de novo e grava o antes e o depois. */
  editarRevisao(revisaoId: string, dados: DadosDaEdicaoDaRevisao): Promise<void>
  /** Corrige o número, o link e a data da aprovação (inclusive acrescentando o número que chegou depois da conclusão). */
  editarAprovacao(aprovacaoId: string, dados: DadosDaAprovacao): Promise<void>
}

/** O que a janela de concluir a Aprovação grava; os três campos são opcionais (null: sem), e a data vem em AAAA-MM-DD. */
export type DadosDaAprovacao = { numeroEprotocolo: string | null; link: string | null; aprovadaEm: string | null }

/** A aprovação registrada do processo; `versao` é o número aprovado (V8) e `registradaPor` o nome de quem a registrou. */
export type Aprovacao = {
  id: string
  versao: number
  numeroEprotocolo: string | null
  link: string | null
  aprovadaEm: string | null
  /** Nome de quem registrou; null se o usuário não puder ser lido. */
  registradaPor: string | null
  registradaEm: string
}
