import { PERFIS, rotuloDoPerfil } from '../../acesso/perfis'
import type { Perfil } from '../../acesso/tipos'

type SeletorDePerfilProps = { id?: string; rotulo?: string; valor: Perfil; aoMudar: (perfil: Perfil) => void }

export function SeletorDePerfil({ id, rotulo, valor, aoMudar }: SeletorDePerfilProps) {
  return (
    <select id={id} aria-label={rotulo} className="seletor-perfil" value={valor}
      onChange={(evento) => aoMudar(evento.target.value as Perfil)}>
      {PERFIS.map((perfil) => <option key={perfil} value={perfil}>{rotuloDoPerfil(perfil)}</option>)}
    </select>
  )
}
