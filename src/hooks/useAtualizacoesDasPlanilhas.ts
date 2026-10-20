import { useCallback, useEffect } from 'react'
import type { ModuloDePlanilhas } from '../planilhas/tipos'
import { useCarregamento } from './useCarregamento'

export const INTERVALO_DA_RELEITURA_MS = 5000

/** As últimas tentativas; enquanto uma está "Em andamento", relê sozinho e para quando ela termina ou fica sem resposta. */
export function useAtualizacoesDasPlanilhas(planilhas: ModuloDePlanilhas) {
  const ler = useCallback(() => planilhas.listarAtualizacoes(), [planilhas])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const emAndamento = estado.tipo === 'pronto' && estado.valor.some((tentativa) => tentativa.resultado === 'em_andamento')

  useEffect(() => {
    if (!emAndamento) return
    const relogio = setInterval(recarregar, INTERVALO_DA_RELEITURA_MS)
    return () => clearInterval(relogio)
  }, [emAndamento, recarregar])

  return { estado, tentarDeNovo, recarregar, emAndamento }
}
