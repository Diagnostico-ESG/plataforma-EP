import { useCallback, useState } from 'react'
import type { ModuloDeVersoes, Versao } from '../versoes/tipos'

export type EstadoDosArquivos = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronto'; versoes: Versao[] }

/**
 * As versões de cada processo da árvore da Lista, lidas só quando o processo é aberto (ou no "Abrir todos"). Ler de novo
 * um processo já pronto mantém o que ele mostrava até a resposta chegar: o envio de uma versão no verso não deixa a linha velha.
 */
export function useArquivosDosProcessos(modulo: ModuloDeVersoes) {
  const [estados, setEstados] = useState<Record<string, EstadoDosArquivos>>({})

  const gravar = useCallback((id: string, estado: EstadoDosArquivos) => setEstados((atuais) => ({ ...atuais, [id]: estado })), [])

  const buscar = useCallback((ids: string[]) => {
    for (const id of ids) {
      setEstados((atuais) => (atuais[id]?.tipo === 'pronto' ? atuais : { ...atuais, [id]: { tipo: 'carregando' } }))
      modulo.listarVersoes(id).then(
        (versoes) => gravar(id, { tipo: 'pronto', versoes }),
        () => gravar(id, { tipo: 'erro' }),
      )
    }
  }, [modulo, gravar])

  return { estados, buscar }
}
