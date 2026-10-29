import { type ReactNode, useState } from 'react'
import type { LinhaDaLista } from '../../processos/linhasDaLista'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { LinhaFantasma } from '../cadastros/PecasDaLista'
import { SeloDoSetor } from '../SeloDoSetor'
import { BarraDeProgresso } from './BarraDeProgresso'
import { COLUNAS_DA_LISTA } from '../../processos/colunasDaLista'
import { CabecalhoCarregando } from './CabecalhoDaLista'
import { NomeComTrecho } from './NomeComTrecho'
import { PilulaDaSituacao } from './PilulaDaSituacao'
import { SeloDeParado } from './SeloDeParado'

const LINHAS_FANTASMA = 3

type TabelaDeProcessosProps = {
  /** O cabeçalho com os menus de ordenação e filtro (CabecalhoDaLista), montado por quem tem os filtros. */
  cabecalho: ReactNode
  linhas: LinhaDaLista[]
  /** Os cancelados (depois dos filtros): ficam escondidos até alguém pedir; vazio, a linha de pedir não existe. */
  cancelados: LinhaDaLista[]
  idEscolhido: string | null
  aoAbrir: (id: string) => void
  busca: string | null
}

/** A Lista: tabela compacta, no padrão das listas de cadastros. */
export function TabelaDeProcessos({ cabecalho, linhas, cancelados, idEscolhido, aoAbrir, busca }: TabelaDeProcessosProps) {
  // O bloco dos cancelados é só da tela: não entra no endereço (spec, "Endereço da página").
  const [verCancelados, setVerCancelados] = useState(false)
  const linhaDe = (linha: LinhaDaLista) => (
    <LinhaDoProcesso key={linha.id} linha={linha} escolhida={linha.id === idEscolhido} aoAbrir={aoAbrir} busca={busca} />
  )
  return (
    <table className="tabela-cadastros tabela-de-processos">
      {cabecalho}
      <tbody>{linhas.map(linhaDe)}</tbody>
      {cancelados.length > 0 && (
        <tbody className="linha-dos-cancelados">
          <tr>
            <td colSpan={COLUNAS_DA_LISTA.length}>
              <button type="button" className="botao botao-secundario" aria-expanded={verCancelados} onClick={() => setVerCancelados(!verCancelados)}>
                {verCancelados ? 'Esconder cancelados' : `Mostrar cancelados (${cancelados.length})`}
              </button>
            </td>
          </tr>
        </tbody>
      )}
      {cancelados.length > 0 && verCancelados && (
        <tbody className="bloco-de-cancelados">
          <tr><th scope="rowgroup" colSpan={COLUNAS_DA_LISTA.length}>Cancelados</th></tr>
          {cancelados.map(linhaDe)}
        </tbody>
      )}
    </table>
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

type LinhaDoProcessoProps = { linha: LinhaDaLista; escolhida: boolean; aoAbrir: (id: string) => void; busca: string | null }

// A linha inteira abre o painel; o botão no nome dá o mesmo caminho a quem usa o teclado e recebe o foco ao fechar.
function LinhaDoProcesso({ linha, escolhida, aoAbrir, busca }: LinhaDoProcessoProps) {
  return (
    <tr className="linha-clicavel" aria-current={escolhida ? 'true' : undefined} onClick={() => aoAbrir(linha.id)}>
      <td>
        <button type="button" id={`linha-${linha.id}`} className="cadastros-abrir">
          <NomeComTrecho nome={linha.nome} busca={busca} />
        </button>
        {linha.nomeDoPai && <span className="lista-pai">↳ {linha.nomeDoPai}</span>}
        <SeloDeParado processo={linha} />
      </td>
      <td>{ROTULO_DO_TIPO[linha.tipo]}</td>
      <td><SeloDoSetor sigla={linha.setorSigla} cor={linha.setorCor ?? 1} /></td>
      <td>{linha.macroprocessoNome}</td>
      <td>{linha.etapaAtual ? <BarraDeProgresso processo={linha} /> : '—'}</td>
      <td>{linha.responsavel?.nome ?? '—'}</td>
      <td>
        <span className="lista-situacao">
          <PilulaDaSituacao situacao={linha.situacao} />
        </span>
      </td>
    </tr>
  )
}
