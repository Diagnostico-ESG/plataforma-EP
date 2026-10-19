import { useId, useState } from 'react'
import { ehTextoLongo } from '../../processos/textoLongo'

/** Texto que, longo, mostra até 4 linhas e "Ler mais" (que vira "Ler menos"); o corte é do CSS. */
export function TextoQueSeAbre({ texto }: { texto: string }) {
  const idDoTexto = useId()
  const [aberto, setAberto] = useState(false)
  if (!ehTextoLongo(texto)) return <p className="texto-que-se-abre">{texto}</p>
  return (
    <>
      <p id={idDoTexto} className={aberto ? 'texto-que-se-abre' : 'texto-que-se-abre texto-cortado'}>{texto}</p>
      <button type="button" className="contexto-link" aria-expanded={aberto} aria-controls={idDoTexto}
        onClick={() => setAberto(!aberto)}>
        {aberto ? 'Ler menos' : 'Ler mais'}
      </button>
    </>
  )
}
