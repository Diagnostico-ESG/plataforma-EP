import { useState } from 'react'
import { iniciais } from '../lib/iniciais'
import './Avatar.css'

type AvatarProps = {
  nome: string
  fotoUrl?: string
  /** 20px nas opções de lista, 24px no cartão, 32px em cabeçalhos e no Agora do verso. */
  tamanho?: 20 | 24 | 32
  /**
   * Só enfeite, para dentro de uma <option> ou ao lado do nome escrito: as iniciais saem por CSS (data-iniciais) e não entram no texto da opção,
   * que o navegador usa para achar a opção quando se digita; a foto fica sem texto alternativo.
   */
  decorativo?: boolean
  /** O avatar de quem está logado fica azul; o dos outros usuários é cinza. */
  proprio?: boolean
}

export function Avatar({ nome, fotoUrl, tamanho = 24, decorativo = false, proprio = false }: AvatarProps) {
  // Guarda o endereço que falhou (e não um booleano) para tentar de novo se a foto mudar.
  const [fotoQueFalhou, setFotoQueFalhou] = useState<string>()
  const classeDoCirculo = proprio ? 'avatar avatar-iniciais avatar-proprio' : 'avatar avatar-iniciais'
  // 0,42 do diâmetro: duas iniciais em peso 600 cabem no círculo com folga nos três tamanhos.
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }
  if (fotoUrl && fotoUrl !== fotoQueFalhou) {
    // O servidor de fotos do Google recusa pedidos que informam o site de origem (referrer).
    return (
      <img className="avatar" style={estilo} src={fotoUrl} alt={decorativo ? '' : nome} referrerPolicy="no-referrer"
        onError={() => setFotoQueFalhou(fotoUrl)} />
    )
  }
  if (decorativo) return <span className={classeDoCirculo} style={estilo} aria-hidden="true" data-iniciais={iniciais(nome)} />
  return (
    <span className={classeDoCirculo} style={estilo} role="img" aria-label={nome}>
      {iniciais(nome)}
    </span>
  )
}

/** Sem responsável: um círculo tracejado vazio, no mesmo tamanho do avatar. */
export function AvatarVazio({ tamanho = 24 }: { tamanho?: 20 | 24 | 32 }) {
  return <span className="avatar avatar-vazio" style={{ width: tamanho, height: tamanho }} role="img" aria-label="Sem responsável" />
}
