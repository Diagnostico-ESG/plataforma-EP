import type { ArquivoDaVersao } from '../versoes/tipos'

export type ResultadoDaRevisao = 'sem_alteracao' | 'corrigida'
export type EscopoDaCorrecao = 'fluxograma' | 'relatorio' | 'ambos'

/** O que a janela de registrar a revisão interna grava: o escopo só vale em "corrigida"; o comentário vem aparado (null: sem). */
export type DadosDaRevisao = { resultado: ResultadoDaRevisao; escopo: EscopoDaCorrecao | null; comentario: string | null }

/** O que a janela de editar a revisão grava: o resultado (que recalcula as versões), o escopo só em "corrigida" e o comentário aparado. */
export type DadosDaEdicaoDaRevisao = DadosDaRevisao

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
  /** Verdadeiro na revisão registrada na passagem em que o processo está agora pela Revisão interna (a que ainda se edita no Agora). Ausente: não. */
  daPassagemAberta?: boolean
}

/**
 * Único ponto por onde a interface fala com o banco nas revisões. Recusa do banco chega como TravaDoBanco, com a frase
 * pronta; outra falha, como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeRevisoes = {
  /** As revisões do processo, da mais recente para a mais antiga. */
  listarRevisoes(processoId: string): Promise<RevisaoInterna[]>
  /** A aprovação do processo; null quando ainda não há. */
  lerAprovacao(processoId: string): Promise<Aprovacao | null>
  /** Registra a revisão da passagem atual pela Revisão interna; não move o processo. O banco decide as versões e recusa fora da etapa. */
  registrarRevisao(processoId: string, dados: DadosDaRevisao): Promise<void>
  /** Registra a aprovação da versão mais recente; se já há uma, ela toma o lugar da anterior. Não move o processo. */
  registrarAprovacao(processoId: string, dados: DadosDaAprovacao): Promise<void>
  /** Corrige o resultado (recalcula as versões), o escopo (só na "corrigida") e o comentário; o banco confere de novo e grava o antes e o depois. */
  editarRevisao(revisaoId: string, dados: DadosDaEdicaoDaRevisao): Promise<void>
  /** Corrige o número, o link e a data da aprovação (inclusive acrescentando o número que chegou depois da conclusão). */
  editarAprovacao(aprovacaoId: string, dados: DadosDaAprovacao): Promise<void>
  /**
   * Registra, altera ou (com null) apaga a data da validação, AAAA-MM-DD e nunca futura. O banco só aceita com o processo na
   * Validação com o setor e em andamento.
   */
  registrarDataDaValidacao(processoId: string, data: string | null): Promise<void>
}

/** O que a janela de registrar ou editar a aprovação grava; os três campos são opcionais (null: sem), e a data vem em AAAA-MM-DD. */
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
  /** O .pdf protocolado atual da aprovação; null sem ele. Ausente: quem monta a aprovação à mão não o informou. */
  pdf?: ArquivoDaVersao | null
}
