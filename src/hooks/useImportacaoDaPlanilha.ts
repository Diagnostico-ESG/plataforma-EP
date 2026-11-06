import { useState } from 'react'
import { type Previa, type ResumoDaImportacao, gravarNovos, lerArquivoDaPlanilha, montarPrevia } from '../importacao/executarImportacao'
import { FRASE_DA_FALHA_DE_LEITURA, frasesDaRecusa } from '../importacao/frasesDaImportacao'
import type { ModuloDeImportacao } from '../importacao/tipos'

export type FaseDaImportacao =
  | { tipo: 'escolher'; recusa: string | null }
  | { tipo: 'lendo' }
  | { tipo: 'previa'; previa: Previa }
  | { tipo: 'gravando'; feitos: number; total: number }
  | { tipo: 'resumo'; resumo: ResumoDaImportacao }

/** Os passos da primeira entrega: escolher a planilha, ver a prévia, confirmar e ver o resumo. Nada é gravado antes de confirmar. */
export function useImportacaoDaPlanilha(importacao: ModuloDeImportacao) {
  const [fase, setFase] = useState<FaseDaImportacao>({ tipo: 'escolher', recusa: null })

  async function escolher(arquivo: File) {
    setFase({ tipo: 'lendo' })
    let lida
    try {
      lida = await lerArquivoDaPlanilha(arquivo, new Date())
    } catch (erro) {
      setFase({ tipo: 'escolher', recusa: frasesDaRecusa(erro) })
      return
    }
    try {
      setFase({ tipo: 'previa', previa: montarPrevia(lida, await importacao.listarExistentes()) })
    } catch {
      setFase({ tipo: 'escolher', recusa: FRASE_DA_FALHA_DE_LEITURA })
    }
  }

  async function confirmar() {
    if (fase.tipo !== 'previa') return
    const total = fase.previa.novos.length
    setFase({ tipo: 'gravando', feitos: 0, total })
    const resumo = await gravarNovos(importacao, fase.previa, (feitos) => setFase({ tipo: 'gravando', feitos, total }))
    setFase({ tipo: 'resumo', resumo })
  }

  const recomecar = () => setFase({ tipo: 'escolher', recusa: null })
  return { fase, escolher, confirmar, recomecar }
}
