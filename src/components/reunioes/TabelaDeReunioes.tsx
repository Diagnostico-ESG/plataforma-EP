import { ehProxima, semAnotacoes } from '../../reunioes/quandoAcontece'
import { ROTULO_DO_TIPO_DE_REUNIAO, dataEHoraDaReuniao } from '../../reunioes/rotulos'
import type { Reuniao } from '../../reunioes/tipos'
import { LinhaFantasma } from '../cadastros/PecasDaLista'

const COLUNAS = ['Data e hora', 'Tipo', 'Setor', 'Processos', 'Local']
const LINHAS_FANTASMA = 3

type TabelaDeReunioesProps = {
  /** Já na ordem: as próximas primeiro, depois as realizadas. */
  reunioes: Reuniao[]
  hoje: string
  idEscolhido: string | null
  aoAbrir: (id: string) => void
}

/** A área Reuniões: tabela compacta, no padrão da Lista de processos, com as próximas separadas das realizadas. */
export function TabelaDeReunioes({ reunioes, hoje, idEscolhido, aoAbrir }: TabelaDeReunioesProps) {
  const proximas = reunioes.filter((reuniao) => ehProxima(reuniao.data, hoje))
  const realizadas = reunioes.filter((reuniao) => !ehProxima(reuniao.data, hoje))
  return (
    <table className="tabela-cadastros tabela-de-reunioes">
      <CabecalhoDaTabela />
      <GrupoDeReunioes titulo="Próximas" reunioes={proximas} hoje={hoje} idEscolhido={idEscolhido} aoAbrir={aoAbrir} />
      <GrupoDeReunioes titulo="Realizadas" reunioes={realizadas} hoje={hoje} idEscolhido={idEscolhido} aoAbrir={aoAbrir} />
    </table>
  )
}

export function TabelaCarregando() {
  return (
    <table className="tabela-cadastros tabela-de-reunioes" aria-busy="true">
      <caption role="status">Carregando reuniões…</caption>
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

type GrupoProps = Omit<TabelaDeReunioesProps, 'reunioes'> & { titulo: string; reunioes: Reuniao[] }

function GrupoDeReunioes({ titulo, reunioes, hoje, idEscolhido, aoAbrir }: GrupoProps) {
  if (reunioes.length === 0) return null
  return (
    <tbody>
      <tr className="reunioes-grupo"><th colSpan={COLUNAS.length} scope="colgroup">{titulo}</th></tr>
      {reunioes.map((reuniao) => (
        <LinhaDaReuniao key={reuniao.id} reuniao={reuniao} hoje={hoje} escolhida={reuniao.id === idEscolhido} aoAbrir={aoAbrir} />
      ))}
    </tbody>
  )
}

type LinhaDaReuniaoProps = { reuniao: Reuniao; hoje: string; escolhida: boolean; aoAbrir: (id: string) => void }

// A linha inteira abre o painel; o botão na data dá o mesmo caminho a quem usa o teclado e recebe o foco ao fechar.
function LinhaDaReuniao({ reuniao, hoje, escolhida, aoAbrir }: LinhaDaReuniaoProps) {
  return (
    <tr className="linha-clicavel" aria-current={escolhida ? 'true' : undefined} onClick={() => aoAbrir(reuniao.id)}>
      <td>
        <button type="button" id={`linha-reuniao-${reuniao.id}`} className="cadastros-abrir">
          {dataEHoraDaReuniao(reuniao)}
        </button>
        {semAnotacoes(reuniao, hoje) && <span className="reuniao-sem-anotacoes">sem anotações</span>}
      </td>
      <td>{ROTULO_DO_TIPO_DE_REUNIAO[reuniao.tipo]}</td>
      <td>{reuniao.setorSigla}</td>
      <td>{reuniao.processos.length ? reuniao.processos.map((processo) => processo.nome).join(', ') : '—'}</td>
      <td>{reuniao.local ?? '—'}</td>
    </tr>
  )
}
