import { useState } from 'react'
import { MenuDeAcoes } from '../MenuDeAcoes'
import type { ArquivoDaVersao, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { FormularioDeSubstituicao } from './FormularioDeSubstituicao'

type AcaoSubstituirProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  arquivo: ArquivoDaVersao
  aoConcluir: () => void
}

/** O "⋯" do arquivo, com Substituir: abre o formulário da troca no lugar. O nome do "⋯" traz o arquivo, pois são vários por versão. */
export function AcaoSubstituir({ modulo, processoId, versao, arquivo, aoConcluir }: AcaoSubstituirProps) {
  const [aberto, setAberto] = useState(false)
  if (!aberto) {
    return (
      <MenuDeAcoes rotulo={`Ações de ${arquivo.nome}`} grupos={[[{ rotulo: 'Substituir', aoEscolher: () => setAberto(true) }]]} />
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
