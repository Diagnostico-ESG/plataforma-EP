import { useCallback } from 'react'
import type { Aprovacao, ModuloDeRevisoes, RevisaoInterna } from '../revisoes/tipos'
import { type EstadoDoCarregamento, useCarregamento } from './useCarregamento'

/** Os registros do processo que o Agora e a gaveta mostram: as revisões de todas as passagens e a aprovação atual. */
export type RegistrosDoProcesso = {
  revisoes: EstadoDoCarregamento<RevisaoInterna[]>
  aprovacao: EstadoDoCarregamento<Aprovacao | null>
  /** Lê os dois de novo, sem piscar o "Carregando…" (depois de registrar ou editar). */
  atualizar: () => void
  /** Lê os dois de novo, voltando a mostrar o "Carregando…" (o botão "Tentar de novo" da falha). */
  tentarDeNovo: () => void
}

/**
 * Lê as revisões e a aprovação do processo. Lê de novo quando o processo muda de etapa: a revisão da passagem aberta e o
 * botão do Agora dependem de onde ele está.
 */
export function useRegistrosDoProcesso(revisoes: ModuloDeRevisoes, processoId: string, etapaId: string | undefined): RegistrosDoProcesso {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a etapa não é usada dentro: só faz a leitura se refazer quando ela muda
  const lerRevisoes = useCallback(() => revisoes.listarRevisoes(processoId), [revisoes, processoId, etapaId])
  // eslint-disable-next-line react-hooks/exhaustive-deps -- idem
  const lerAprovacao = useCallback(() => revisoes.lerAprovacao(processoId), [revisoes, processoId, etapaId])
  const listadas = useCarregamento(lerRevisoes)
  const aprovada = useCarregamento(lerAprovacao)
  return {
    revisoes: listadas.estado, aprovacao: aprovada.estado,
    atualizar: () => {
      listadas.recarregar()
      aprovada.recarregar()
    },
    tentarDeNovo: () => {
      listadas.tentarDeNovo()
      aprovada.tentarDeNovo()
    },
  }
}
