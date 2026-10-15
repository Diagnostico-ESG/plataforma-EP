import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CaixasDeMarcar } from './CaixasDeMarcar'

type EscolhaDeProcessosProps = {
  reunioes: ModuloDeReunioes
  setorId: string
  marcados: string[]
  aoMudar: (marcados: string[]) => void
}

/** Os processos e subprocessos do setor, em qualquer situação, em caixas de marcar (o cancelado leva o aviso no nome). */
export function EscolhaDeProcessos({ reunioes, setorId, marcados, aoMudar }: EscolhaDeProcessosProps) {
  const carregar = useCallback(() => reunioes.listarProcessosDoSetor(setorId), [reunioes, setorId])
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando processos…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos do setor" aoTentarDeNovo={tentarDeNovo} />
  if (estado.valor.length === 0) return <p className="cadastros-vazio">Este setor ainda não tem processos.</p>
  const opcoes = estado.valor.map((processo) => ({ id: processo.id, rotulo: `${processo.nome}${processo.cancelado ? ' (cancelado)' : ''}` }))
  return <CaixasDeMarcar legenda="Processos tratados" opcoes={opcoes} marcados={marcados} aoMudar={aoMudar} />
}
