import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { EventosDoHistorico } from '../cadastros/EventosDoHistorico'

type HistoricoDoProcessoProps = { processos: ModuloDeProcessos; id: string }

// Só leitura: o histórico não tem botão de alteração para nenhum perfil.
export function HistoricoDoProcesso({ processos, id }: HistoricoDoProcessoProps) {
  const ler = useCallback(() => processos.lerHistoricoDoProcesso(id), [processos, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return <EventosDoHistorico estado={estado} aoTentarDeNovo={tentarDeNovo} />
}
