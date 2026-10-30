import { useState } from 'react'
import type { MacroDaArvore, SetorRaizDaArvore } from '../processos/arvoreDaLista'

export const chaveDoMacro = (macroId: string) => `m:${macroId}`
export const chaveDoSetor = (macroId: string, setorId: string) => `s:${macroId}:${setorId}`
// Na árvore por Setor o setor vem primeiro: as chaves têm outro prefixo para nunca colidir com as da árvore por Macroprocesso.
export const chaveDoSetorRaiz = (setorId: string) => `r:${setorId}`
export const chaveDoMacroNoSetor = (setorId: string, macroId: string) => `n:${setorId}:${macroId}`

/** O que a árvore tem para abrir e fechar: as chaves dos grupos (setores e macroprocessos) e os ids dos processos. */
export type EstruturaDaArvore = { grupos: string[]; processos: string[] }

export const estruturaPorMacro = (arvore: MacroDaArvore[]): EstruturaDaArvore => ({
  grupos: arvore.flatMap((macro) => [chaveDoMacro(macro.id), ...macro.setores.map((setor) => chaveDoSetor(macro.id, setor.id))]),
  processos: arvore.flatMap((macro) => macro.setores.flatMap((setor) => setor.itens.map((item) => item.linha.id))),
})

export const estruturaPorSetor = (arvore: SetorRaizDaArvore[]): EstruturaDaArvore => ({
  grupos: arvore.flatMap((setor) => [chaveDoSetorRaiz(setor.id), ...setor.macros.map((macro) => chaveDoMacroNoSetor(setor.id, macro.id))]),
  processos: arvore.flatMap((setor) => setor.macros.flatMap((macro) => macro.itens.map((item) => item.linha.id))),
})

function comAlternado(conjunto: Set<string>, chave: string): Set<string> {
  const novo = new Set(conjunto)
  if (!novo.delete(chave)) novo.add(chave)
  return novo
}

/**
 * O que está aberto na árvore da Lista (só da tela, não vai ao endereço): macroprocessos e setores abrem por padrão
 * (guardamos os fechados); os processos, que mostram os arquivos, abrem fechados (guardamos os abertos).
 */
export function useAbertosDaArvore({ grupos, processos }: EstruturaDaArvore) {
  const [fechados, setFechados] = useState<Set<string>>(new Set())
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const tudoAberto = grupos.every((chave) => !fechados.has(chave)) && processos.every((id) => abertos.has(id))

  return {
    grupoAberto: (chave: string) => !fechados.has(chave),
    processoAberto: (id: string) => abertos.has(id),
    alternarGrupo: (chave: string) => setFechados((atuais) => comAlternado(atuais, chave)),
    /** Devolve se o processo ficou aberto (quem abre precisa buscar os arquivos). */
    alternarProcesso: (id: string) => {
      setAbertos((atuais) => comAlternado(atuais, id))
      return !abertos.has(id)
    },
    tudoAberto,
    /** Devolve os processos que ficaram abertos, para buscar os arquivos de todos. */
    abrirTudo: () => {
      setFechados(new Set())
      setAbertos(new Set(processos))
      return processos
    },
    fecharTudo: () => {
      setFechados(new Set(grupos))
      setAbertos(new Set())
    },
  }
}
