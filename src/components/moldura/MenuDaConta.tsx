import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { UsuarioAtual } from '../../acesso/tipos'
import { Avatar } from '../Avatar'

type MenuDaContaProps = { usuario: UsuarioAtual; aoSair: () => Promise<void> }

const FALHA_AO_SAIR = 'Não foi possível sair. Verifique a conexão e tente de novo.'

// Se o Sair falha, a pessoa continua dentro e precisa saber por quê (num computador compartilhado,
// achar que saiu sem ter saído é o pior caso).
function useSaida(aoSair: () => Promise<void>) {
  const [falhaAoSair, setFalhaAoSair] = useState(false)
  const sair = () => {
    setFalhaAoSair(false)
    aoSair().catch(() => setFalhaAoSair(true))
  }
  return { falhaAoSair, sair }
}

export function MenuDaConta({ usuario, aoSair }: MenuDaContaProps) {
  const [aberto, setAberto] = useState(false)
  const { falhaAoSair, sair } = useSaida(aoSair)
  const idDoPainel = useId()
  const botao = useRef<HTMLButtonElement>(null)
  // O botão que tinha o foco some com o painel; sem devolvê-lo, o teclado volta ao topo da página.
  const fecharComEscape = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape' || !aberto) return
    setAberto(false)
    botao.current?.focus()
  }
  return (
    <div className="menu-conta" onKeyDown={fecharComEscape}>
      <button
        ref={botao}
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
          <button type="button" className="botao botao-secundario" onClick={sair}>
            Sair
          </button>
          {falhaAoSair && <p className="menu-conta-falha" role="alert">{FALHA_AO_SAIR}</p>}
        </div>
      )}
    </div>
  )
}
