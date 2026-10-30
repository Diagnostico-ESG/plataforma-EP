/** A faixa, em px, junto a cada borda do Quadro em que o cartão arrastado faz o Quadro rolar. */
export const MARGEM_DA_BORDA = 60
/** Quanto o Quadro rola a cada aviso de arrastar (o navegador avisa várias vezes por segundo, mesmo com o mouse parado). */
export const PASSO_DA_ROLAGEM = 20

/**
 * Quanto rolar o Quadro na horizontal com o cartão na posição x: para a esquerda perto da borda esquerda, para a direita perto
 * da direita, nada no meio. O arrastar nativo do navegador não rola o Quadro sozinho: o Chrome procura a área rolável mais
 * próxima do mouse, que é a lista de cartões da coluna (só rola na vertical), e para nela.
 */
export function passoDaRolagemNaBorda(x: number, esquerda: number, direita: number): number {
  if (x < esquerda + MARGEM_DA_BORDA) return -PASSO_DA_ROLAGEM
  if (x > direita - MARGEM_DA_BORDA) return PASSO_DA_ROLAGEM
  return 0
}
