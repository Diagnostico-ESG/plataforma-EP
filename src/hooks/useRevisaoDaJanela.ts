import { useState } from 'react'
import type { OpcoesDaRevisao } from '../revisoes/opcoesDaRevisao'
import { RASCUNHO_VAZIO, dadosDaRevisao, rascunhoPronto } from '../revisoes/rascunhoDaRevisao'
import type { DadosDaRevisao } from '../revisoes/tipos'
import { useGravacaoNaJanela } from './useGravacaoNaJanela'

/**
 * A conclusão da Revisão interna na janela de avanço: as opções do Resultado e a gravação, que a janela espera. A frase
 * devolvida é a falha (a janela fica aberta, com o preenchido); null é a revisão gravada.
 */
export type RevisaoDaJanela = {
  opcoes: OpcoesDaRevisao
  aoConfirmar: (dados: DadosDaRevisao, responsavelId: string | null) => Promise<string | null>
}

/**
 * O que a janela guarda da revisão (o rascunho do Resultado, Escopo e Comentário) e se pode confirmar: sem frase de
 * bloqueio (a da janela ou a de nenhuma opção caber), sem gravar e com o rascunho completo. Sem `revisao`, o hook não faz
 * nada além de liberar pelo `bloqueio`.
 */
export function useRevisaoDaJanela(revisao: RevisaoDaJanela | undefined, bloqueio: string | null | undefined, aoFechar: () => void) {
  const [rascunho, setRascunho] = useState(RASCUNHO_VAZIO)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const frase = bloqueio ?? revisao?.opcoes.bloqueio ?? null
  const liberada = frase === null && !salvando && (!revisao || rascunhoPronto(rascunho))
  const confirmar = (responsavelId: string | null) =>
    revisao ? gravar(() => revisao.aoConfirmar(dadosDaRevisao(rascunho), responsavelId)) : Promise.resolve()
  return { rascunho, setRascunho, salvando, falha, frase, liberada, gravar: confirmar }
}
