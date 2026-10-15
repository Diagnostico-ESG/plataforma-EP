import { useId } from 'react'

type OutrosParticipantesProps = { valor: string; aoMudar: (valor: string) => void }

/** Quem não está cadastrado: um nome por linha. Linha vazia e espaços nas pontas saem na gravação. */
export function OutrosParticipantes({ valor, aoMudar }: OutrosParticipantesProps) {
  const id = useId()
  return (
    <>
      <label htmlFor={`${id}-outros`}>Outros participantes</label>
      <textarea id={`${id}-outros`} value={valor} rows={4} aria-describedby={`${id}-dica`}
        onChange={(evento) => aoMudar(evento.target.value)} />
      <span id={`${id}-dica`} className="reuniao-dica">Um nome por linha.</span>
    </>
  )
}
