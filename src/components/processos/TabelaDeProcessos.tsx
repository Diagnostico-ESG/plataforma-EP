import type { ReactNode } from 'react'
import { colunasDaLista } from '../../processos/colunasDaLista'
import type { LinhaDaLista } from '../../processos/linhasDaLista'
import { LinhaFantasma } from '../cadastros/PecasDaLista'
import { CabecalhoCarregando } from './CabecalhoDaLista'
import { LinhaDoProcesso } from './LinhaDoProcesso'

const LINHAS_FANTASMA = 3

type TabelaDeProcessosProps = {
  /** O cabeçalho com os menus de ordenação e filtro (CabecalhoDaLista), montado por quem tem os filtros. */
  cabecalho: ReactNode
  linhas: LinhaDaLista[]
  idEscolhido: string | null
  aoAbrir: (id: string) => void
}

/** A Lista: tabela compacta, no padrão das listas de cadastros. */
export function TabelaDeProcessos({ cabecalho, linhas, idEscolhido, aoAbrir }: TabelaDeProcessosProps) {
  return (
    <table className="tabela-cadastros tabela-de-processos">
      {cabecalho}
      <tbody>
        {linhas.map((linha) => <LinhaDoProcesso key={linha.id} linha={linha} escolhida={linha.id === idEscolhido} aoAbrir={aoAbrir} />)}
      </tbody>
    </table>
  )
}

export function TabelaCarregando({ agrupada = false }: { agrupada?: boolean }) {
  return (
    <table className="tabela-cadastros tabela-de-processos" aria-busy="true">
      <caption role="status">Carregando processos…</caption>
      <CabecalhoCarregando agrupada={agrupada} />
      <tbody>
        {Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} colunas={colunasDaLista(agrupada).length} />)}
      </tbody>
    </table>
  )
}
