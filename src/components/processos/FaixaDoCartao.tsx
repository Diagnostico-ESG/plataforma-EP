import { SeloDoSetor } from '../SeloDoSetor'
import type { ProcessoDaLista } from '../../processos/tipos'

/**
 * Faixa na cor do setor, de lado a lado no topo do cartão, com a sigla. Só nos Quadros por etapa e por responsável: por setor
 * a cor está na coluna e o cartão não leva faixa (ADR 0031). A cor é enfeite: o texto é a sigla.
 */
export function FaixaDoCartao({ processo }: { processo: ProcessoDaLista }) {
  return <SeloDoSetor sigla={processo.setorSigla} cor={processo.setorCor ?? 1} variante="faixa" className="cartao-faixa" />
}
