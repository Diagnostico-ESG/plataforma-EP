import type { LinhaDaLista } from '../../processos/linhasDaLista'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { LinhaFantasma } from '../cadastros/PecasDaLista'
import { Pilula } from '../Pilula'
import { SeloDoSetor } from '../SeloDoSetor'
import { BarraDeProgresso } from './BarraDeProgresso'
import { EtiquetaDoProcesso } from './EtiquetaDoProcesso'
import { NomeComTrecho } from './NomeComTrecho'
import { PilulaDaSituacao } from './PilulaDaSituacao'
import { SeloDeParado } from './SeloDeParado'

const COLUNAS = ['Nome', 'Tipo', 'Setor', 'Macroprocesso', 'Etapa atual', 'Etiqueta', 'Responsável', 'Situação']
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
        <SeloDeParado processo={linha} />
      </td>
      <td>{ROTULO_DO_TIPO[linha.tipo]}</td>
      <td><SeloDoSetor sigla={linha.setorSigla} cor={linha.setorCor ?? 1} /></td>
      <td>{linha.macroprocessoNome}</td>
      <td>{linha.etapaAtual ? <BarraDeProgresso processo={linha} /> : '—'}</td>
      <td><EtiquetaDoProcesso etiqueta={linha.etiqueta} /></td>
      <td>{linha.responsavel?.nome ?? '—'}</td>
      <td>
        <span className="lista-situacao">
          <PilulaDaSituacao situacao={linha.situacao} />
          {linha.arquivadoEm && <Pilula situacao="neutra">Arquivado</Pilula>}
        </span>
      </td>
    </tr>
  )
}
