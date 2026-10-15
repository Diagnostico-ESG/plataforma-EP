import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { EventosDoHistorico } from '../cadastros/EventosDoHistorico'

// Só leitura: o histórico não tem botão de alteração para nenhum perfil.
export function HistoricoDaReuniao({ reunioes, id }: { reunioes: ModuloDeReunioes; id: string }) {
  const ler = useCallback(() => reunioes.lerHistoricoDaReuniao(id), [reunioes, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return <EventosDoHistorico estado={estado} aoTentarDeNovo={tentarDeNovo} />
}
