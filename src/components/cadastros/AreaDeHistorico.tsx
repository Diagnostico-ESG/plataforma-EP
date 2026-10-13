import { useCallback } from 'react'
import type { EventoDoCadastro, ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento, type EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { ErroAoCarregar } from './ErroAoCarregar'
import { ListaDoHistorico } from './ListaDoHistorico'

// Só leitura: o histórico não tem botão de alteração para nenhum perfil (a RLS também não deixa gravar em eventos).
export function AreaDeHistorico({ cadastros }: { cadastros: ModuloDeCadastros }) {
  const listar = useCallback(() => cadastros.listarHistoricoDosCadastros(), [cadastros])
  const { estado, tentarDeNovo } = useCarregamento(listar)
  return (
    <section className="historico" aria-label="Histórico dos cadastros">
      <ConteudoDoHistorico estado={estado} aoTentarDeNovo={tentarDeNovo} />
    </section>
  )
}

type ConteudoProps = { estado: EstadoDoCarregamento<EventoDoCadastro[]>; aoTentarDeNovo: () => void }

function ConteudoDoHistorico({ estado, aoTentarDeNovo }: ConteudoProps) {
  if (estado.tipo === 'carregando') return <p className="historico-aviso">Carregando histórico…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o histórico" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.length === 0) return <p className="historico-aviso">Nenhuma alteração registrada ainda.</p>
  return <ListaDoHistorico eventos={estado.valor} />
}
