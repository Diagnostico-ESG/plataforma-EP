import { useArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { useMovimentoDoProcesso } from '../../hooks/useMovimentoDoProcesso'
import {
  type ColunaDoQuadro as Coluna, colunasDoQuadro, colunasPorResponsavel, colunasPorSetor, quantosForaDoQuadro,
} from '../../processos/colunasDoQuadro'
import type { AgruparQuadroPor, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'
import type { ListaDeProcessos, ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import { JanelasDoMovimento } from './JanelasDoMovimento'
import './Quadro.css'

type QuadroDeProcessosProps = {
  lista: ListaDeProcessos
  idEscolhido: string | null
  /** O endereço do painel de um processo, com a visão e os filtros de agora. */
  enderecoDoProcesso: (id: string) => string
  podeAlterar: boolean
  processos: ModuloDeProcessos
  /** A janela da trava de arquivos envia as versões e o relatório. */
  versoes: ModuloDeVersoes
  /** Um cartão foi movido: a lista de processos precisa recarregar. */
  aoMudar: () => void
  agrupar: AgruparQuadroPor
  /** O filtro Setor: no Quadro por setor, só a coluna dele aparece. */
  setorFiltrado: string | null
  /** Só no Quadro por setor (o portfólio): todos os concluídos ou só eles. */
  mostrar: MostrarNoPortfolio
  /** A Lista em Concluídos com os filtros do Quadro: o "Ver na Lista" do pé da coluna Concluídos. */
  enderecoDosConcluidosNaLista: string
}

const COLUNAS_FANTASMA = [0, 1, 2, 3]

function colunasDoAgrupamento(
  lista: ListaDeProcessos, agrupar: AgruparQuadroPor, setorFiltrado: string | null, mostrar: MostrarNoPortfolio,
): Coluna[] {
  if (agrupar === 'responsavel') return colunasPorResponsavel(lista.processos)
  if (agrupar === 'setor') return colunasPorSetor(lista.setores, lista.processos, setorFiltrado, mostrar)
  return colunasDoQuadro(lista)
}

export function QuadroDeProcessos(props: QuadroDeProcessosProps) {
  const { lista, idEscolhido, enderecoDoProcesso, podeAlterar, processos, versoes, aoMudar, agrupar, setorFiltrado, mostrar, enderecoDosConcluidosNaLista } = props
  const colunas = colunasDoAgrupamento(lista, agrupar, setorFiltrado, mostrar)
  // O processo some do Quadro (excluído por outra pessoa) é o mesmo que mudou: o Quadro só recarrega.
  const movimento = useMovimentoDoProcesso(processos, lista.etapas, aoMudar, aoMudar)
  const arrasto = useArrastoDoQuadro(lista.etapas, movimento.mover)
  const foraDoQuadro = { quantos: quantosForaDoQuadro(lista.processos), enderecoDaLista: enderecoDosConcluidosNaLista }
  return (
    <>
      <JanelasDoMovimento movimento={movimento} processos={processos} versoes={versoes} aoGravar={aoMudar} />
      {movimento.falha && <p className="cadastros-falha" role="alert">{movimento.falha}</p>}
      <div className="quadro-colunas">
        {colunas.map((coluna) => (
          <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso}
            podeAlterar={podeAlterar && !movimento.gravando} arrasto={arrasto} agrupar={agrupar} etapas={lista.etapas}
            foraDoQuadro={foraDoQuadro} />
        ))}
      </div>
    </>
  )
}

export function QuadroCarregando() {
  return (
    <div className="quadro" aria-busy="true">
      <p className="quadro-carregando" role="status">Carregando processos…</p>
      <div className="quadro-colunas" aria-hidden="true">
        {COLUNAS_FANTASMA.map((coluna) => <div key={coluna} className="coluna coluna-fantasma" />)}
      </div>
    </div>
  )
}
