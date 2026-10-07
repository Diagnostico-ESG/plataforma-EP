import { useId, useState } from 'react'
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { UsuarioAtual } from '../../acesso/tipos'
import { Avatar } from '../Avatar'

type MenuDaContaProps = { usuario: UsuarioAtual; aoSair: () => void }

export function MenuDaConta({ usuario, aoSair }: MenuDaContaProps) {
  const [aberto, setAberto] = useState(false)
  const idDoPainel = useId()
  return (
    <div className="menu-conta" onKeyDown={(evento) => evento.key === 'Escape' && setAberto(false)}>
      <button
        type="button"
        className="menu-conta-botao"
        aria-label={`Sua conta: ${usuario.nome}`}
        aria-expanded={aberto}
        aria-controls={idDoPainel}
        onClick={() => setAberto(!aberto)}
      >
        <Avatar nome={usuario.nome} fotoUrl={usuario.fotoUrl ?? undefined} tamanho={32} />
      </button>
      {aberto && (
        <div id={idDoPainel} className="menu-conta-painel">
          <p className="menu-conta-nome">{usuario.nome}</p>
          <p className="menu-conta-perfil">{rotuloDoPerfil(usuario.perfil)}</p>
          <button type="button" className="botao botao-secundario" onClick={aoSair}>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
