import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { LinhaDoTempo } from './LinhaDoTempo'

type HistoricoDoProcessoProps = { processos: ModuloDeProcessos; id: string; versoes: ModuloDeVersoes }

// Só leitura: o histórico não tem botão de alteração para nenhum perfil. O módulo de versões baixa o .pdf guardado.
export function HistoricoDoProcesso({ processos, id, versoes }: HistoricoDoProcessoProps) {
  const ler = useCallback(() => processos.lerHistoricoDoProcesso(id), [processos, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  if (estado.tipo === 'carregando') return <p className="historico-aviso" role="status">Carregando histórico…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o histórico" aoTentarDeNovo={tentarDeNovo} />
  if (estado.valor.length === 0) return <p className="historico-aviso">Nenhuma alteração registrada ainda.</p>
  return <LinhaDoTempo eventos={estado.valor} versoes={versoes} />
}
