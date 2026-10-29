import './MenuDeAcoes.css'
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { useFecharAoClicarFora } from '../hooks/useFecharAoClicarFora'
import { Icone } from './Icone'

/** Com `marcado`, o item é uma opção marcável (menuitemradio), como a ordenação e o filtro do cabeçalho da Lista. */
export type ItemDoMenu = { rotulo: string; aoEscolher: () => void; perigoso?: boolean; marcado?: boolean }
type Ponta = 'primeiro' | 'ultimo'
type MenuDeAcoesProps = {
  rotulo: string
  grupos: ItemDoMenu[][]
  /** A lista abre para a direita do botão (botão perto da borda esquerda do painel); o padrão é para a esquerda. */
  paraDireita?: boolean
  /** No lugar do "⋯": o botão mostra este conteúdo, que lhe dá o nome; o rótulo fica só no menu. */
  conteudoDoBotao?: ReactNode
  classeDoBotao?: string
}

/**
 * O botão "⋯" com as ações raras, em grupos separados por linha (padrão de menu da WAI-ARIA): abre com o foco no
 * primeiro item, as setas, Home e End movem o foco, Esc fecha e volta ao botão, Tab e clique fora fecham.
 */
export function MenuDeAcoes({ rotulo, grupos, paraDireita = false, conteudoDoBotao, classeDoBotao }: MenuDeAcoesProps) {
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
    <div ref={raiz} className={paraDireita ? 'menu-de-acoes menu-de-acoes-para-direita' : 'menu-de-acoes'}>
      <button ref={botao} type="button" className={classeDoBotao ?? 'botao-icone menu-de-acoes-botao'}
        aria-label={conteudoDoBotao ? undefined : rotulo} title={conteudoDoBotao ? undefined : rotulo}
        aria-haspopup="menu" aria-expanded={aberto !== null} aria-controls={aberto ? idDoMenu : undefined}
        onClick={() => setAberto(aberto ? null : 'primeiro')} onKeyDown={abrirPelaSeta(setAberto)}>
        {conteudoDoBotao ?? <Icone nome="reticencias" />}
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
        {/* A posição entra na chave: no filtro de Responsável, duas pessoas podem ter o mesmo nome. */}
        {itens.map((item, posicao) => (
          <button key={`${posicao}-${item.rotulo}`} type="button" tabIndex={-1} {...papelDoItem(item)}
            className={item.perigoso ? 'menu-de-acoes-item menu-de-acoes-perigoso' : 'menu-de-acoes-item'}
            onClick={() => aoEscolher(item)}>
            {item.rotulo}
          </button>
        ))}
      </div>
    </>
  )
}

// A marca visual do item marcado (o "✓") vem do CSS por aria-checked; o leitor de tela lê o próprio aria-checked.
function papelDoItem({ marcado }: ItemDoMenu) {
  return marcado === undefined ? { role: 'menuitem' } : { role: 'menuitemradio', 'aria-checked': marcado }
}

function itensDoMenu(lista: HTMLElement | null): HTMLElement[] {
  return lista ? Array.from(lista.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')) : []
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
