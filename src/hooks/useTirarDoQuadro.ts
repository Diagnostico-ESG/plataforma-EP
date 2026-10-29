import { createContext, useContext, useEffect, useState } from 'react'
import type { ModuloDeProcessos } from '../processos/tipos'
import { useGravacaoComFalha } from './useGravacaoComFalha'

/** O aviso "Tirado do Quadro · Desfazer" some sozinho depois disto (spec: cerca de 8 segundos). */
export const SEGUNDOS_DO_AVISO = 8

export type QuemSaiu = { id: string; nome: string }

/** Tira o processo do Quadro; `depois` roda quando a gravação deu certo (o verso o usa para reler o processo). */
export type TirarDoQuadro = (processo: QuemSaiu, depois?: () => void) => Promise<void>

/**
 * Tirar do Quadro e o Desfazer: grava, avisa o Quadro (`aoMudar`) e guarda o aviso, que some sozinho, ao fechar ou ao desfazer.
 * A falha fica guardada para a tela mostrar; o processo que sumiu (excluído por outra pessoa) só recarrega o Quadro.
 */
export function useTirarDoQuadro(processos: Pick<ModuloDeProcessos, 'tirarDoQuadro' | 'voltarAoQuadro'>, aoMudar: () => void) {
  const [aviso, setAviso] = useState<QuemSaiu | null>(null)
  const { falha, executar } = useGravacaoComFalha(aoMudar)
  // O aviso novo é um objeto novo: o efeito reinicia a contagem.
  useEffect(() => {
    if (aviso === null) return
    const relogio = setTimeout(() => setAviso(null), SEGUNDOS_DO_AVISO * 1000)
    return () => clearTimeout(relogio)
  }, [aviso])

  const tirar: TirarDoQuadro = (processo, depois) => executar(
    () => processos.tirarDoQuadro(processo.id),
    () => {
      setAviso({ id: processo.id, nome: processo.nome })
      depois?.()
      aoMudar()
    },
  )
  const desfazer = async () => {
    if (aviso === null) return
    await executar(() => processos.voltarAoQuadro(aviso.id), () => {
      setAviso(null)
      aoMudar()
    })
  }
  return { aviso, falha, tirar, desfazer, fechar: () => setAviso(null) }
}

/** A tela do Quadro e o verso tiram pelo mesmo caminho; fora da área de Processos não há provedor e o botão não aparece. */
export const ContextoDoTirarDoQuadro = createContext<TirarDoQuadro | null>(null)

export function useTirarDoQuadroDaTela(): TirarDoQuadro | null {
  return useContext(ContextoDoTirarDoQuadro)
}
