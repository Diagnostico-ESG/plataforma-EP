import { type FocusEvent, type KeyboardEvent, useCallback, useRef, useState } from 'react'
import { useFecharAoClicarFora } from '../../hooks/useFecharAoClicarFora'
import { SEM_FILTROS, type FiltrosDosProcessos as Filtros } from '../../processos/enderecoDosProcessos'
import { quantosFiltros, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'
import { Icone } from '../Icone'
import { FiltrosDosProcessos } from './FiltrosDosProcessos'

type BotaoDosFiltrosProps = { opcoes: OpcoesDosFiltros; filtros: Filtros; aoMudar: (filtros: Filtros) => void }

// A lista aberta da caixa personalizável (appearance: base-select) faz parte do DOM: o Esc dela chega ao painel e deve fechar só
// a lista. Navegador sem :open lança erro no matches; ali o Esc da lista nativa não chega ao painel.
function seletorAberto(alvo: EventTarget): boolean {
  const seletor = alvo instanceof Element ? alvo.closest('select') : null
  if (!seletor) return false
  try {
    return seletor.matches(':open')
  } catch {
    return false
  }
}

function nomeDoBotao(ligados: number): string {
  if (ligados === 0) return 'Filtros'
  return `Filtros, ${ligados} ${ligados === 1 ? 'ligado' : 'ligados'}`
}

/**
 * [Filtros n]: os cinco filtros num painel preso ao botão, que se aplicam ao escolher. O painel fecha pelo botão, pelo Esc, pelo
 * clique fora e quando o foco sai dele (Tab), como o menu de ações; pelo botão e pelo Esc, o foco volta ao botão.
 */
export function BotaoDosFiltros({ opcoes, filtros, aoMudar }: BotaoDosFiltrosProps) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const fechar = useCallback(() => setAberto(false), [])
  useFecharAoClicarFora(raiz, aberto, fechar)
  const ligados = quantosFiltros(filtros)
  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape' || seletorAberto(evento.target)) return
    fechar()
    botao.current?.focus()
  }
  const aoSairDoPainel = (evento: FocusEvent) => {
    if (!raiz.current?.contains(evento.relatedTarget as Node | null)) fechar()
  }
  // O [Limpar filtros] some ao limpar; sem mover o foco, ele cairia no começo da página.
  const limpar = () => {
    aoMudar(SEM_FILTROS)
    setTimeout(() => raiz.current?.querySelector('select')?.focus(), 0)
  }
  return (
    <div ref={raiz} className="botao-dos-filtros">
      <button ref={botao} type="button" className={ligados > 0 ? 'botao botao-ligado' : 'botao botao-secundario'}
        aria-label={nomeDoBotao(ligados)} aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <Icone nome="filtro" tamanho={16} />
        Filtros
        {/* Sempre no lugar (escondido sem filtro): ligar o primeiro filtro não empurra os controles seguintes. */}
        <span className={ligados > 0 ? 'faixa-contador' : 'faixa-contador faixa-contador-vazio'} aria-hidden="true">{ligados}</span>
      </button>
      {aberto && (
        <div role="dialog" aria-label="Filtros" className="botao-dos-filtros-painel" onKeyDown={aoTeclar} onBlur={aoSairDoPainel}>
          <FiltrosDosProcessos opcoes={opcoes} filtros={filtros} aoMudar={aoMudar} aoLimpar={limpar} />
        </div>
      )}
    </div>
  )
}
