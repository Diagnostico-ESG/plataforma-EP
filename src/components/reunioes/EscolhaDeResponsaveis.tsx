import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { responsaveisDaEscolha } from '../../reunioes/participantesDaEscolha'
import type { ModuloDeReunioes, ResponsavelDaReuniao } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CaixasDeMarcar } from './CaixasDeMarcar'

type EscolhaDeResponsaveisProps = {
  reunioes: ModuloDeReunioes
  setorId: string
  /** Os responsáveis já marcados na reunião que se edita, se o setor escolhido ainda é o dela. */
  daReuniao: ResponsavelDaReuniao[]
  marcados: string[]
  aoMudar: (marcados: string[]) => void
}

/** Os responsáveis do setor escolhido, em caixas de marcar. */
export function EscolhaDeResponsaveis({ reunioes, setorId, daReuniao, marcados, aoMudar }: EscolhaDeResponsaveisProps) {
  const carregar = useCallback(() => reunioes.listarResponsaveisDoSetor(setorId), [reunioes, setorId])
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando responsáveis…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os responsáveis do setor" aoTentarDeNovo={tentarDeNovo} />
  const responsaveis = responsaveisDaEscolha(estado.valor, daReuniao)
  if (responsaveis.length === 0) return <p className="cadastros-vazio">Este setor ainda não tem responsáveis.</p>
  const opcoes = responsaveis.map((responsavel) => ({ id: responsavel.id, rotulo: responsavel.nome }))
  return <CaixasDeMarcar legenda="Responsáveis do setor" opcoes={opcoes} marcados={marcados} aoMudar={aoMudar} />
}
