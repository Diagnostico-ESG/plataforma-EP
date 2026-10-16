import { useId } from 'react'
import { lerNumeroHistorico } from '../../versoes/formularioDeVersao'

type CampoDoNumeroHistoricoProps = { texto: string; aoMudar: (texto: string) => void }

/** O número digitado da versão histórica (5 vira V5F); a frase da recusa aparece ao lado quando o texto não vale. */
export function CampoDoNumeroHistorico({ texto, aoMudar }: CampoDoNumeroHistoricoProps) {
  const id = useId()
  const invalido = texto !== '' && lerNumeroHistorico(texto) === null
  return (
    <div className="campo-de-arquivo">
      <label htmlFor={id}>Número da versão</label>
      <input id={id} type="text" inputMode="numeric" value={texto} aria-invalid={invalido ? true : undefined}
        aria-describedby={invalido ? `${id}-recusa` : undefined} onChange={(evento) => aoMudar(evento.target.value)} />
      {invalido && <p id={`${id}-recusa`} className="cadastros-falha">Digite um número inteiro maior que zero.</p>}
    </div>
  )
}
