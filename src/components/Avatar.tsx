import { iniciais } from '../lib/iniciais'
import './Avatar.css'

type AvatarProps = {
  nome: string
  fotoUrl?: string
  /** 20px no cartão, 24px em listas, 32px em cabeçalhos. */
  tamanho?: 20 | 24 | 32
}

export function Avatar({ nome, fotoUrl, tamanho = 24 }: AvatarProps) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }
  if (fotoUrl) {
    return <img className="avatar" style={estilo} src={fotoUrl} alt={nome} />
  }
  return (
    <span className="avatar avatar-iniciais" style={estilo} role="img" aria-label={nome}>
      {iniciais(nome)}
    </span>
  )
}
