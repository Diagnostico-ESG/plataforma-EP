import type { Ref } from 'react'
import { PERFIS, rotuloDoPerfil } from '../../acesso/perfis'
import type { Perfil } from '../../acesso/tipos'

type SeletorDePerfilProps = {
  id?: string
  rotulo?: string
  valor: Perfil
  aoMudar: (perfil: Perfil) => void
  ref?: Ref<HTMLSelectElement>
}

export function SeletorDePerfil({ id, rotulo, valor, aoMudar, ref }: SeletorDePerfilProps) {
  return (
    <select ref={ref} id={id} aria-label={rotulo} className="seletor-perfil" value={valor}
      onChange={(evento) => aoMudar(evento.target.value as Perfil)}>
      {PERFIS.map((perfil) => <option key={perfil} value={perfil}>{rotuloDoPerfil(perfil)}</option>)}
    </select>
  )
}
