import { type KeyboardEvent, type RefObject, useEffect, useId, useRef, useState } from 'react'
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { UsuarioAtual } from '../../acesso/tipos'
import { Avatar } from '../Avatar'
import { useSaida } from '../../hooks/useSaida'

type MenuDaContaProps = { usuario: UsuarioAtual; aoSair: () => Promise<void> }

const FALHA_AO_SAIR = 'Não foi possível sair. Verifique a conexão e tente de novo.'

export function MenuDaConta({ usuario, aoSair }: MenuDaContaProps) {
  const [aberto, setAberto] = useState(false)
  const { falhaAoSair, saindo, tentarSair, esquecerFalha } = useSaida(aoSair)
  const idDoPainel = useId()
  const menu = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const botaoSair = useRef<HTMLButtonElement>(null)
  const fechar = () => {
    setAberto(false)
    esquecerFalha()
  }
  // O botão que tinha o foco some com o painel; sem devolvê-lo, o teclado volta ao topo da página.
  const fecharComEscape = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape' || !aberto) return
    fechar()
    botao.current?.focus()
  }
  useFecharAoClicarFora(menu, aberto, fechar)
  // O Sair fica desativado durante a tentativa e perde o foco; na falha, o foco volta para ele.
  useEffect(() => {
    if (falhaAoSair) botaoSair.current?.focus()
  }, [falhaAoSair])
  return (
    <div ref={menu} className="menu-conta" onKeyDown={fecharComEscape}>
      <button
        ref={botao}
        type="button"
        className="menu-conta-botao"
        aria-label={`Sua conta: ${usuario.nome}`}
        aria-expanded={aberto}
        aria-controls={idDoPainel}
        onClick={() => (aberto ? fechar() : setAberto(true))}
      >
        <Avatar nome={usuario.nome} fotoUrl={usuario.fotoUrl ?? undefined} tamanho={32} />
      </button>
      {aberto && (
        <div id={idDoPainel} className="menu-conta-painel">
          <p className="menu-conta-nome">{usuario.nome}</p>
          <p className="menu-conta-perfil">{rotuloDoPerfil(usuario.perfil)}</p>
          <button ref={botaoSair} type="button" className="botao botao-secundario" disabled={saindo} onClick={tentarSair}>
            Sair
          </button>
          {falhaAoSair && <p className="menu-conta-falha" role="alert">{FALHA_AO_SAIR}</p>}
        </div>
      )}
    </div>
  )
}

// pointerdown (e não click): fecha antes de o clique fora acionar outra coisa por baixo do painel.
// O ouvinte é refeito a cada renderização com o menu aberto (fechar muda); com o menu, isso é raro e barato.
function useFecharAoClicarFora(menu: RefObject<HTMLDivElement | null>, aberto: boolean, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return
    const aoApertar = (evento: PointerEvent) => {
      if (!menu.current?.contains(evento.target as Node)) fechar()
    }
    document.addEventListener('pointerdown', aoApertar)
    return () => document.removeEventListener('pointerdown', aoApertar)
  }, [menu, aberto, fechar])
}
