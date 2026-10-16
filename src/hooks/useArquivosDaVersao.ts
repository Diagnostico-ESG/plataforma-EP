import { useCallback, useRef, useState } from 'react'
import { conferirArquivo } from '../versoes/conferenciaDosArquivos'
import type { Escolhidos, RecusasDosCampos } from '../versoes/formularioDeVersao'
import type { PapelDoArquivo } from '../versoes/tipos'

/**
 * Os arquivos escolhidos no formulário da versão e a conferência de cada um. A conferência lê o arquivo (assíncrona):
 * se outro arquivo for escolhido no mesmo campo antes de ela terminar, o resultado antigo é descartado.
 */
export function useArquivosDaVersao() {
  const [escolhidos, setEscolhidos] = useState<Escolhidos>({})
  const [recusas, setRecusas] = useState<RecusasDosCampos>({})
  const [conferindo, setConferindo] = useState(0)
  const ultimos = useRef<Escolhidos>({})

  const escolher = useCallback(async (papel: PapelDoArquivo, arquivo: File | null) => {
    ultimos.current = { ...ultimos.current, [papel]: arquivo ?? undefined }
    setEscolhidos((atuais) => ({ ...atuais, [papel]: arquivo ?? undefined }))
    setRecusas((atuais) => ({ ...atuais, [papel]: undefined }))
    if (!arquivo) return
    setConferindo((quantos) => quantos + 1)
    const recusa = await conferirArquivo(papel, arquivo)
    setConferindo((quantos) => quantos - 1)
    if (ultimos.current[papel] !== arquivo) return
    setRecusas((atuais) => ({ ...atuais, [papel]: recusa ?? undefined }))
  }, [])

  return { escolhidos, recusas, conferindo: conferindo > 0, escolher }
}
