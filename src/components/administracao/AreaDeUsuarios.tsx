import type { ModuloDeAcesso } from '../../acesso/tipos'
import { useUsuarios } from '../../hooks/useUsuarios'
import { ListaDeUsuarios } from './ListaDeUsuarios'

type AreaDeUsuariosProps = { acesso: ModuloDeAcesso }

export function AreaDeUsuarios({ acesso }: AreaDeUsuariosProps) {
  const { lista, tentarDeNovo } = useUsuarios(acesso)
  return (
    <section className="administracao" aria-labelledby="titulo-usuarios">
      <h2 id="titulo-usuarios" className="administracao-titulo">Usuários</h2>
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo} />
    </section>
  )
}
