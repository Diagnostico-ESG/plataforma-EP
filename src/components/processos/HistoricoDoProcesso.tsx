import { useCallback } from 'react'
import type { EventoDoCadastro } from '../../cadastros/tipos'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { EventoDoHistorico } from '../cadastros/ListaDoHistorico'

type HistoricoDoProcessoProps = { processos: ModuloDeProcessos; id: string }

// Só leitura: o histórico não tem botão de alteração para nenhum perfil. As classes historico-* vêm da Administração.
export function HistoricoDoProcesso({ processos, id }: HistoricoDoProcessoProps) {
  const ler = useCallback(() => processos.lerHistoricoDoProcesso(id), [processos, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return <ConteudoDoHistorico estado={estado} aoTentarDeNovo={tentarDeNovo} />
}

type ConteudoProps = { estado: EstadoDoCarregamento<EventoDoCadastro[]>; aoTentarDeNovo: () => void }

function ConteudoDoHistorico({ estado, aoTentarDeNovo }: ConteudoProps) {
  if (estado.tipo === 'carregando') return <p className="historico-aviso" role="status">Carregando histórico…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o histórico" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.length === 0) return <p className="historico-aviso">Nenhuma alteração registrada ainda.</p>
  return (
    <ol className="historico-lista">
      {estado.valor.map((evento) => <EventoDoHistorico key={evento.id} evento={evento} />)}
    </ol>
  )
}
