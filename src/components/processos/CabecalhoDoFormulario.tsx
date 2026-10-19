import type { RefObject } from 'react'
import { BotaoFecharJanela } from './CabecalhoDoVerso'

type CabecalhoDoFormularioProps = {
  /** "Novo processo" ou "Editar {nome}". */
  titulo: string
  /** O título recebe o foco ao abrir, para o leitor de tela começar por ele. */
  referencia: RefObject<HTMLHeadingElement | null>
  aoFechar: () => void
}

/** O cabeçalho da janela estreita do formulário do processo (Novo processo e Editar). */
export function CabecalhoDoFormulario({ titulo, referencia, aoFechar }: CabecalhoDoFormularioProps) {
  return (
    <header className="verso-cabecalho verso-cabecalho-formulario">
      <h2 ref={referencia} tabIndex={-1} className="verso-titulo">{titulo}</h2>
      <BotaoFecharJanela aoFechar={aoFechar} />
    </header>
  )
}
