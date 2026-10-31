import { type KeyboardEvent, useCallback, useRef, useState } from 'react'
import { useFecharAoClicarFora } from '../../hooks/useFecharAoClicarFora'
import type { FiltrosDosProcessos as Filtros } from '../../processos/enderecoDosProcessos'
import { quantosFiltros, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'
import { Icone } from '../Icone'
import { FiltrosDosProcessos } from './FiltrosDosProcessos'

type BotaoDosFiltrosProps = { opcoes: OpcoesDosFiltros; filtros: Filtros; aoMudar: (filtros: Filtros) => void }

/**
 * [Filtros n]: os cinco filtros num painel preso ao botão, que se aplicam ao escolher. O painel fecha pelo botão, pelo Esc e
 * pelo clique fora (como o menu de ações); pelo botão e pelo Esc, o foco volta ao botão.
 */
export function BotaoDosFiltros({ opcoes, filtros, aoMudar }: BotaoDosFiltrosProps) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const fechar = useCallback(() => setAberto(false), [])
  useFecharAoClicarFora(raiz, aberto, fechar)
  const ligados = quantosFiltros(filtros)
  // Esc é do painel: sem parar aqui, a janela do verso por trás (se houver) fecharia junto.
  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape') return
    evento.stopPropagation()
    fechar()
    botao.current?.focus()
  }
  return (
    <div ref={raiz} className="botao-dos-filtros">
      <button ref={botao} type="button" className={ligados > 0 ? 'botao botao-ligado' : 'botao botao-secundario'}
        aria-label={ligados > 0 ? `Filtros, ${ligados} ligados` : 'Filtros'} aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <Icone nome="filtro" tamanho={16} />
        Filtros
        {ligados > 0 && <span className="faixa-contador" aria-hidden="true">{ligados}</span>}
      </button>
      {aberto && (
        <div role="dialog" aria-label="Filtros" className="botao-dos-filtros-painel" onKeyDown={aoTeclar}>
          <FiltrosDosProcessos opcoes={opcoes} filtros={filtros} aoMudar={aoMudar} />
        </div>
      )}
    </div>
  )
}
