import type { EventoDoCadastro } from '../../cadastros/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { ErroAoCarregar } from './ErroAoCarregar'
import { EventoDoHistorico } from './ListaDoHistorico'

type EventosDoHistoricoProps = { estado: EstadoDoCarregamento<EventoDoCadastro[]>; aoTentarDeNovo: () => void }

/** Os eventos de um item com os estados comuns (carregando, erro, vazio). As classes historico-* vêm da Administração. */
export function EventosDoHistorico({ estado, aoTentarDeNovo }: EventosDoHistoricoProps) {
  if (estado.tipo === 'carregando') return <p className="historico-aviso" role="status">Carregando histórico…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o histórico" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.length === 0) return <p className="historico-aviso">Nenhuma alteração registrada ainda.</p>
  return (
    <ol className="historico-lista">
      {estado.valor.map((evento) => <EventoDoHistorico key={evento.id} evento={evento} />)}
    </ol>
  )
}
