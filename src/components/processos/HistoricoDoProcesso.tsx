import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { juntarEventos } from '../../reunioes/juntarEventos'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { EventosDoHistorico } from '../cadastros/EventosDoHistorico'

type HistoricoDoProcessoProps = { processos: ModuloDeProcessos; reunioes: ModuloDeReunioes; id: string }

// Só leitura: o histórico não tem botão de alteração para nenhum perfil. Junta os eventos do processo com os das
// reuniões em que ele aparece; se uma das duas leituras falha, o histórico todo falha (nunca mostra um pedaço só).
export function HistoricoDoProcesso({ processos, reunioes, id }: HistoricoDoProcessoProps) {
  const ler = useCallback(async () => juntarEventos(
    ...(await Promise.all([processos.lerHistoricoDoProcesso(id), reunioes.lerEventosDeReuniaoDoProcesso(id)])),
  ), [processos, reunioes, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return <EventosDoHistorico estado={estado} aoTentarDeNovo={tentarDeNovo} />
}
