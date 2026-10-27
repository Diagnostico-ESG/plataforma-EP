import { useState } from 'react'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { MenuDeAcoes } from '../MenuDeAcoes'
import { JanelaDoNumeroDaVersao } from './JanelaDoNumeroDaVersao'

type AcaoEditarNumeroProps = {
  modulo: Pick<ModuloDeVersoes, 'editarNumero'>
  versao: Versao
  /** Chamado quando o número foi gravado: quem mostra as versões lê de novo. */
  aoGravar: () => void
}

/** O "⋯" ao lado do rótulo da versão, com Editar número (ADR 0028); o nome do "⋯" traz a versão, pois são várias. */
export function AcaoEditarNumero({ modulo, versao, aoGravar }: AcaoEditarNumeroProps) {
  const [aberta, setAberta] = useState(false)
  const rotulo = rotuloDaVersao(versao)
  return (
    <>
      <MenuDeAcoes rotulo={`Ações da ${rotulo}`} paraDireita grupos={[[{ rotulo: 'Editar número', aoEscolher: () => setAberta(true) }]]} />
      {aberta && <JanelaDoNumeroDaVersao modulo={modulo} versao={versao} aoGravar={aoGravar} aoFechar={() => setAberta(false)} />}
    </>
  )
}
