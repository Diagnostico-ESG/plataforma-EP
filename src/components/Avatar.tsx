import { useState } from 'react'
import { iniciais } from '../lib/iniciais'
import './Avatar.css'

type AvatarProps = {
  nome: string
  fotoUrl?: string
  /** 20px no cartão, 24px em listas, 32px em cabeçalhos. */
  tamanho?: 20 | 24 | 32
}

export function Avatar({ nome, fotoUrl, tamanho = 24 }: AvatarProps) {
  // Guarda o endereço que falhou (e não um booleano) para tentar de novo se a foto mudar.
  const [fotoQueFalhou, setFotoQueFalhou] = useState<string>()
  // 0,42 do diâmetro: duas iniciais em peso 600 cabem no círculo com folga nos três tamanhos.
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }
  if (fotoUrl && fotoUrl !== fotoQueFalhou) {
    // O servidor de fotos do Google recusa pedidos que informam o site de origem (referrer).
    return (
      <img className="avatar" style={estilo} src={fotoUrl} alt={nome} referrerPolicy="no-referrer"
        onError={() => setFotoQueFalhou(fotoUrl)} />
    )
  }
  return (
    <span className="avatar avatar-iniciais" style={estilo} role="img" aria-label={nome}>
      {iniciais(nome)}
    </span>
  )
}
