import { useId } from 'react'
import { lerNumeroDigitado } from '../../versoes/formularioDeVersao'

type CampoDoNumeroDaVersaoProps = { texto: string; aoMudar: (texto: string) => void }

/** O número digitado da versão histórica ou piloto (5 vira V5F, 6 vira V6P); a frase aparece ao lado quando o texto não vale. */
export function CampoDoNumeroDaVersao({ texto, aoMudar }: CampoDoNumeroDaVersaoProps) {
  const id = useId()
  const invalido = texto !== '' && lerNumeroDigitado(texto) === null
  return (
    <div className="campo-de-arquivo">
      <label htmlFor={id}>Número da versão</label>
      <input id={id} type="text" inputMode="numeric" value={texto} aria-invalid={invalido ? true : undefined}
        aria-describedby={invalido ? `${id}-recusa` : undefined} onChange={(evento) => aoMudar(evento.target.value)} />
      {invalido && <p id={`${id}-recusa`} className="cadastros-falha">Digite um número inteiro maior que zero.</p>}
    </div>
  )
}
