import type { CSSProperties } from 'react'
import { estiloDaCor } from '../../cadastros/corDoSetor'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import type { ProcessoDaLista } from '../../processos/tipos'
import { SeloDoSetor } from '../SeloDoSetor'

type FaixaDoCartaoProps = { processo: ProcessoDaLista; agrupar: AgruparQuadroPor }

/**
 * Faixa na cor do setor, de lado a lado no topo do cartão. Por etapa e por responsável leva a sigla; por setor, a sigla já
 * está no título da coluna, então leva o nome do processo (que sai do corpo do cartão). A cor é enfeite: o texto é o nome.
 */
export function FaixaDoCartao({ processo, agrupar }: FaixaDoCartaoProps) {
  const cor = processo.setorCor ?? 1
  if (agrupar !== 'setor') return <SeloDoSetor sigla={processo.setorSigla} cor={cor} variante="faixa" className="cartao-faixa" />
  return (
    <span className="selo-do-setor selo-do-setor-faixa cartao-faixa cartao-faixa-nome" style={estiloDaCor(cor) as CSSProperties}>
      {processo.nome}
    </span>
  )
}
