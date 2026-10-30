import { type ReactNode, useState } from 'react'
import { COLUNAS_DA_LISTA } from '../../processos/colunasDaLista'
import type { LinhaDaLista } from '../../processos/linhasDaLista'
import { LinhaFantasma } from '../cadastros/PecasDaLista'
import { CabecalhoCarregando } from './CabecalhoDaLista'
import { LinhaDoProcesso } from './LinhaDoProcesso'

const LINHAS_FANTASMA = 3

type TabelaDeProcessosProps = {
  /** O cabeçalho com os menus de ordenação e filtro (CabecalhoDaLista), montado por quem tem os filtros. */
  cabecalho: ReactNode
  linhas: LinhaDaLista[]
  /** Os cancelados (depois dos filtros): ficam escondidos até alguém pedir; vazio, a linha de pedir não existe. */
  cancelados: LinhaDaLista[]
  idEscolhido: string | null
  aoAbrir: (id: string) => void
}

/** A Lista: tabela compacta, no padrão das listas de cadastros. */
export function TabelaDeProcessos({ cabecalho, linhas, cancelados, idEscolhido, aoAbrir }: TabelaDeProcessosProps) {
  const linhaDe = (linha: LinhaDaLista) => (
    <LinhaDoProcesso key={linha.id} linha={linha} escolhida={linha.id === idEscolhido} aoAbrir={aoAbrir} />
  )
  return (
    <table className="tabela-cadastros tabela-de-processos">
      {cabecalho}
      <tbody>{linhas.map(linhaDe)}</tbody>
      <CanceladosDaLista cancelados={cancelados} linhaDe={linhaDe} />
    </table>
  )
}

type CanceladosDaListaProps = { cancelados: LinhaDaLista[]; linhaDe: (linha: LinhaDaLista) => ReactNode }

/**
 * Os cancelados, no fim da tabela ou da árvore (fora dos ramos): a linha "Mostrar cancelados (N)" e, pedida, o bloco com as
 * mesmas colunas, setor e macroprocesso inclusos. O bloco é só da tela: não entra no endereço (spec, "Endereço da página").
 */
export function CanceladosDaLista({ cancelados, linhaDe }: CanceladosDaListaProps) {
  const [verCancelados, setVerCancelados] = useState(false)
  if (cancelados.length === 0) return null
  return (
    <>
      <tbody className="linha-dos-cancelados">
        <tr>
          <td colSpan={COLUNAS_DA_LISTA.length}>
            <button type="button" className="botao botao-secundario" aria-expanded={verCancelados} onClick={() => setVerCancelados(!verCancelados)}>
              {verCancelados ? 'Esconder cancelados' : `Mostrar cancelados (${cancelados.length})`}
            </button>
          </td>
        </tr>
      </tbody>
      {verCancelados && (
        <tbody className="bloco-de-cancelados">
          <tr><th scope="rowgroup" colSpan={COLUNAS_DA_LISTA.length}>Cancelados</th></tr>
          {cancelados.map(linhaDe)}
        </tbody>
      )}
    </>
  )
}

export function TabelaCarregando() {
  return (
    <table className="tabela-cadastros tabela-de-processos" aria-busy="true">
      <caption role="status">Carregando processos…</caption>
      <CabecalhoCarregando />
      <tbody>
        {Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} colunas={COLUNAS_DA_LISTA.length} />)}
      </tbody>
    </table>
  )
}
