import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { type FiltrosDasReunioes as Filtros, SEM_FILTROS_DAS_REUNIOES } from '../../reunioes/enderecoDasReunioes'
import { filtrarReunioes, temFiltro } from '../../reunioes/filtrosDasReunioes'
import { ordenarReunioes } from '../../reunioes/quandoAcontece'
import type { Reuniao } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Icone } from '../Icone'
import { FiltrosDasReunioes, NenhumaReuniaoComFiltros } from './FiltrosDasReunioes'
import { TabelaCarregando, TabelaDeReunioes } from './TabelaDeReunioes'

type VisaoDasReunioesProps = {
  estado: EstadoDoCarregamento<Reuniao[]>
  hoje: string
  aoTentarDeNovo: () => void
  podeAlterar: boolean
  aoRegistrar: () => void
  idEscolhido: string | null
  aoAbrir: (id: string) => void
  filtros: Filtros
  aoMudarFiltros: (filtros: Filtros) => void
}

/** A lista das reuniões com os estados comuns (carregando, erro, vazio), a barra de cima e os filtros. */
export function VisaoDasReunioes(props: VisaoDasReunioesProps) {
  const { estado, hoje, aoTentarDeNovo, podeAlterar, aoRegistrar, filtros, aoMudarFiltros } = props
  if (estado.tipo === 'carregando') return <div className="quadro"><TabelaCarregando /></div>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="as reuniões" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.length === 0) return <NenhumaReuniaoRegistrada podeRegistrar={podeAlterar} aoRegistrar={aoRegistrar} />
  const visiveis = ordenarReunioes(filtrarReunioes(estado.valor, filtros), hoje)
  return (
    <div className="quadro">
      <div className="quadro-barra">
        <FiltrosDasReunioes reunioes={estado.valor} filtros={filtros} aoMudar={aoMudarFiltros} />
        {podeAlterar && <BotaoRegistrar aoRegistrar={aoRegistrar} />}
      </div>
      {visiveis.length === 0 && temFiltro(filtros)
        ? <NenhumaReuniaoComFiltros aoLimpar={() => aoMudarFiltros(SEM_FILTROS_DAS_REUNIOES)} />
        : <TabelaDeReunioes reunioes={visiveis} hoje={hoje} idEscolhido={props.idEscolhido} aoAbrir={props.aoAbrir} />}
    </div>
  )
}

function BotaoRegistrar({ aoRegistrar }: { aoRegistrar: () => void }) {
  return (
    <button type="button" className="botao botao-principal" onClick={aoRegistrar}>
      <Icone nome="mais" tamanho={16} />
      Registrar reunião
    </button>
  )
}

function NenhumaReuniaoRegistrada({ podeRegistrar, aoRegistrar }: { podeRegistrar: boolean; aoRegistrar: () => void }) {
  return (
    <section className="quadro-vazio" aria-labelledby="reunioes-vazio-titulo">
      <h2 id="reunioes-vazio-titulo" className="quadro-vazio-titulo">Nenhuma reunião registrada.</h2>
      {podeRegistrar && <BotaoRegistrar aoRegistrar={aoRegistrar} />}
    </section>
  )
}
