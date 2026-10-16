import { useState } from 'react'
import type { ArquivoDaVersao, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { FormularioDeSubstituicao } from './FormularioDeSubstituicao'

type AcaoSubstituirProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  arquivo: ArquivoDaVersao
  aoConcluir: () => void
}

/** [Substituir] ao lado do arquivo: abre o formulário da troca no lugar do botão. O nome do botão traz o arquivo, pois são vários por versão. */
export function AcaoSubstituir({ modulo, processoId, versao, arquivo, aoConcluir }: AcaoSubstituirProps) {
  const [aberto, setAberto] = useState(false)
  if (!aberto) {
    return (
      <button type="button" className="botao botao-secundario" aria-label={`Substituir ${arquivo.nome}`} onClick={() => setAberto(true)}>
        Substituir
      </button>
    )
  }
  const concluir = () => {
    setAberto(false)
    aoConcluir()
  }
  return (
    <FormularioDeSubstituicao modulo={modulo} processoId={processoId} versao={versao} arquivo={arquivo} aoSubstituido={concluir}
      aoCancelar={() => setAberto(false)} />
  )
}
