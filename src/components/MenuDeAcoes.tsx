import './MenuDeAcoes.css'
import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import { useFecharAoClicarFora } from '../hooks/useFecharAoClicarFora'
import { Icone } from './Icone'

export type ItemDoMenu = { rotulo: string; aoEscolher: () => void; perigoso?: boolean }
type Ponta = 'primeiro' | 'ultimo'
type MenuDeAcoesProps = { rotulo: string; grupos: ItemDoMenu[][] }

/**
 * O botão "⋯" com as ações raras, em grupos separados por linha (padrão de menu da WAI-ARIA): abre com o foco no
 * primeiro item, as setas, Home e End movem o foco, Esc fecha e volta ao botão, Tab e clique fora fecham.
 */
export function MenuDeAcoes({ rotulo, grupos }: MenuDeAcoesProps) {
  const [aberto, setAberto] = useState<Ponta | null>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const idDoMenu = useId()
  const fechar = useCallback(() => setAberto(null), [])
  useFecharAoClicarFora(raiz, aberto !== null, fechar)
  const voltarAoBotao = () => {
    fechar()
    botao.current?.focus()
  }
  // O menu fecha antes da ação: a janela que ela abrir devolve o foco ao botão quando fechar.
  const escolher = (item: ItemDoMenu) => {
    voltarAoBotao()
    item.aoEscolher()
  }
  return (
    <div ref={raiz} className="menu-de-acoes">
      <button ref={botao} type="button" className="botao-icone menu-de-acoes-botao" aria-label={rotulo} title={rotulo}
        aria-haspopup="menu" aria-expanded={aberto !== null} aria-controls={aberto ? idDoMenu : undefined}
        onClick={() => setAberto(aberto ? null : 'primeiro')} onKeyDown={abrirPelaSeta(setAberto)}>
        <Icone nome="reticencias" />
      </button>
      {aberto && (
        <ListaDoMenu id={idDoMenu} rotulo={rotulo} grupos={grupos} ponta={aberto} aoEscolher={escolher}
          aoSair={voltarAoBotao} aoTab={fechar} />
      )}
    </div>
  )
}

function abrirPelaSeta(abrir: (ponta: Ponta) => void) {
  return (evento: KeyboardEvent) => {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return
    evento.preventDefault()
    abrir(evento.key === 'ArrowDown' ? 'primeiro' : 'ultimo')
  }
}

type ListaDoMenuProps = {
  id: string
  rotulo: string
  grupos: ItemDoMenu[][]
  ponta: Ponta
  aoEscolher: (item: ItemDoMenu) => void
  aoSair: () => void
  aoTab: () => void
}

function ListaDoMenu({ id, rotulo, grupos, ponta, aoEscolher, aoSair, aoTab }: ListaDoMenuProps) {
  const lista = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const itens = itensDoMenu(lista.current)
    itens[ponta === 'primeiro' ? 0 : itens.length - 1]?.focus()
  }, [ponta])
  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key === 'Tab') return aoTab()
    // Esc é do menu: sem impedir a ação padrão, a janela do verso por trás fecharia junto.
    if (evento.key === 'Escape') {
      evento.preventDefault()
      evento.stopPropagation()
      return aoSair()
    }
    moverFoco(evento, itensDoMenu(lista.current))
  }
  return (
    <div ref={lista} id={id} role="menu" aria-label={rotulo} className="menu-de-acoes-lista" onKeyDown={aoTeclar}>
      {grupos.map((grupo, indice) => (
        <GrupoDoMenu key={indice} itens={grupo} separado={indice > 0} aoEscolher={aoEscolher} />
      ))}
    </div>
  )
}

function GrupoDoMenu({ itens, separado, aoEscolher }: { itens: ItemDoMenu[]; separado: boolean; aoEscolher: (item: ItemDoMenu) => void }) {
  return (
    <>
      {separado && <div role="separator" className="menu-de-acoes-separador" />}
      <div role="group">
        {itens.map((item) => (
          <button key={item.rotulo} type="button" role="menuitem" tabIndex={-1}
            className={item.perigoso ? 'menu-de-acoes-item menu-de-acoes-perigoso' : 'menu-de-acoes-item'}
            onClick={() => aoEscolher(item)}>
            {item.rotulo}
          </button>
        ))}
      </div>
    </>
  )
}

function itensDoMenu(lista: HTMLElement | null): HTMLElement[] {
  return lista ? Array.from(lista.querySelectorAll<HTMLElement>('[role="menuitem"]')) : []
}

function moverFoco(evento: KeyboardEvent, itens: HTMLElement[]) {
  const destino = proximoIndice(evento.key, itens.indexOf(document.activeElement as HTMLElement), itens.length)
  if (destino === null) return
  evento.preventDefault()
  itens[destino].focus()
}

/** Para onde o foco vai no menu: as setas dão a volta; Home e End vão às pontas; outra tecla não move. */
function proximoIndice(tecla: string, atual: number, total: number): number | null {
  if (tecla === 'ArrowDown') return (atual + 1) % total
  if (tecla === 'ArrowUp') return (atual - 1 + total) % total
  if (tecla === 'Home') return 0
  if (tecla === 'End') return total - 1
  return null
}
