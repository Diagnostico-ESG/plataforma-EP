export type OrigemDaAtualizacao = 'automatica' | 'botao'
export type ResultadoDaAtualizacao = 'em_andamento' | 'sem_resposta' | 'concluida' | 'falhou'

/** Uma tentativa de atualizar as planilhas; `iniciadaEm` é ISO e `motivo` o código curto da falha (só em "falhou"). */
export type AtualizacaoDasPlanilhas = {
  id: string
  iniciadaEm: string
  origem: OrigemDaAtualizacao
  /** Nome de quem pediu pelo botão; null na automática (ou se o usuário não puder ser lido). */
  pedidaPor: string | null
  resultado: ResultadoDaAtualizacao
  motivo: string | null
}

export type LinksDasPlanilhas = { interna: string; publica: string }

/**
 * Único ponto por onde a interface fala com o banco nas planilhas. Recusa do banco chega como TravaDoBanco, com a
 * frase pronta; outra falha, como Error cuja mensagem é o motivo.
 */
export type ModuloDePlanilhas = {
  /** As últimas 10 tentativas, da mais recente para a mais antiga. */
  listarAtualizacoes(): Promise<AtualizacaoDasPlanilhas[]>
  /** Os dois endereços; null quando as planilhas ainda não foram configuradas no ambiente. */
  lerLinks(): Promise<LinksDasPlanilhas | null>
  /** Registra a tentativa e envia o pedido; a tentativa nasce "Em andamento". */
  pedirAtualizacao(): Promise<void>
}
