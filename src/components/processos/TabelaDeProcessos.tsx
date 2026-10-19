import type { LinhaDaLista } from '../../processos/linhasDaLista'
import { textoDaEtapaAtual } from '../../processos/linhasDaLista'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { LinhaFantasma } from '../cadastros/PecasDaLista'
import { NomeComTrecho } from './NomeComTrecho'
import { PilulaDaSituacao } from './PilulaDaSituacao'

const COLUNAS = ['Nome', 'Tipo', 'Setor', 'Macroprocesso', 'Etapa atual', 'Responsável', 'Situação']
const LINHAS_FANTASMA = 3

type TabelaDeProcessosProps = { linhas: LinhaDaLista[]; idEscolhido: string | null; aoAbrir: (id: string) => void; busca: string | null }

/** A Lista: tabela compacta, no padrão das listas de cadastros. */
export function TabelaDeProcessos({ linhas, idEscolhido, aoAbrir, busca }: TabelaDeProcessosProps) {
  return (
    <table className="tabela-cadastros tabela-de-processos">
      <CabecalhoDaTabela />
      <tbody>
        {linhas.map((linha) => (
          <LinhaDoProcesso key={linha.id} linha={linha} escolhida={linha.id === idEscolhido} aoAbrir={aoAbrir} busca={busca} />
        ))}
      </tbody>
    </table>
  )
}

export function TabelaCarregando() {
  return (
    <table className="tabela-cadastros tabela-de-processos" aria-busy="true">
      <caption role="status">Carregando processos…</caption>
      <CabecalhoDaTabela />
      <tbody>
        {Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} colunas={COLUNAS.length} />)}
      </tbody>
    </table>
  )
}

function CabecalhoDaTabela() {
  return (
    <thead>
      <tr>{COLUNAS.map((coluna) => <th key={coluna} scope="col">{coluna}</th>)}</tr>
    </thead>
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
      </td>
      <td>{ROTULO_DO_TIPO[linha.tipo]}</td>
      <td>{linha.setorSigla}</td>
      <td>{linha.macroprocessoNome}</td>
      <td>{textoDaEtapaAtual(linha)}</td>
      <td>{linha.responsavel?.nome ?? '—'}</td>
      <td><PilulaDaSituacao situacao={linha.situacao} /></td>
    </tr>
  )
}
