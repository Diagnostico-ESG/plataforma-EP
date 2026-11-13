// O rótulo do relatório numerado num ponto só (ADR 0047: V para a versão, R para o relatório). Sem importações, para versões,
// revisões, processos e histórico o usarem sem dependência circular.

/**
 * "Relatório R2": o relatório numerado em todas as telas, inclusive o enviado antes da mudança (o texto vem do número). O
 * número chega como texto na recusa do banco ("numero_do_relatorio_mudou:4").
 */
export function rotuloDoRelatorio(numero: number | string): string {
  return `Relatório R${numero}`
}
