import { useEffect, useState } from 'react'
import type { ArquivoDaVersao, ModuloDeVersoes, SituacaoNoDrive } from '../versoes/tipos'

type Conferido = { id: string; tamanho: number; situacao: SituacaoNoDrive | undefined }

/**
 * Como o .pdf da aprovação está no Drive agora (MD5 e existência comparados com o banco). Pergunta quando a gaveta abre e de novo
 * quando o .pdf muda (troca do conteúdo): a resposta de um .pdf que já mudou não vale, então a marca de antes some. Sem .pdf, sem
 * marca; a falha da conferência também fica sem marca.
 */
export function useSituacaoDoPdf(modulo: ModuloDeVersoes, processoId: string, pdf: ArquivoDaVersao | null): SituacaoNoDrive | undefined {
  const [conferido, setConferido] = useState<Conferido | null>(null)
  const id = pdf?.id
  const tamanho = pdf?.tamanho
  useEffect(() => {
    if (id === undefined || tamanho === undefined) return
    let valida = true
    modulo.conferirArquivos(processoId).then(
      (situacoes) => { if (valida) setConferido({ id, tamanho, situacao: situacoes[id] }) },
      () => { if (valida) setConferido(null) },
    )
    return () => { valida = false }
  }, [modulo, processoId, id, tamanho])
  return conferido?.id === id && conferido?.tamanho === tamanho ? conferido?.situacao : undefined
}
