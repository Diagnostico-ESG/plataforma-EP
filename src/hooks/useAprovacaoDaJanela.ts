import { useState } from 'react'
import { RASCUNHO_DA_APROVACAO_VAZIO, dadosDaAprovacao } from '../revisoes/rascunhoDaAprovacao'
import type { DadosDaAprovacao } from '../revisoes/tipos'
import { useGravacaoNaJanela } from './useGravacaoNaJanela'

/**
 * A conclusão da Aprovação pelo setor na janela de avanço: a versão aprovada (a mais recente) e a gravação, que a janela
 * espera. A frase devolvida é a falha (a janela fica aberta, com o preenchido); null é a aprovação gravada.
 */
export type AprovacaoDaJanela = {
  versao: number | null
  aoConfirmar: (dados: DadosDaAprovacao, responsavelId: string | null) => Promise<string | null>
}

/**
 * O que a janela guarda da aprovação (o rascunho do número, do link e da data) e se pode confirmar: sem frase de bloqueio
 * (a versão incompleta ou ausente) e sem gravar. Os três campos são opcionais, então o rascunho nunca impede.
 */
export function useAprovacaoDaJanela(aprovacao: AprovacaoDaJanela | undefined, bloqueio: string | null | undefined, aoFechar: () => void) {
  const [rascunho, setRascunho] = useState(RASCUNHO_DA_APROVACAO_VAZIO)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const frase = bloqueio ?? null
  const confirmar = (responsavelId: string | null) =>
    aprovacao ? gravar(() => aprovacao.aoConfirmar(dadosDaAprovacao(rascunho), responsavelId)) : Promise.resolve()
  return { rascunho, setRascunho, salvando, falha, frase, liberada: frase === null && !salvando, gravar: confirmar }
}
