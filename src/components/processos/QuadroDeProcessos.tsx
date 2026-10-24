import { useArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { useMovimentoDoProcesso } from '../../hooks/useMovimentoDoProcesso'
import { colunasDoQuadro, colunasPorResponsavel } from '../../processos/colunasDoQuadro'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import type { ListaDeProcessos, ModuloDeProcessos } from '../../processos/tipos'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import { JanelaDaChegada } from './JanelaDaChegada'
import './Quadro.css'

type QuadroDeProcessosProps = {
  lista: ListaDeProcessos
  idEscolhido: string | null
  /** O endereço do painel de um processo, com a visão e os filtros de agora. */
  enderecoDoProcesso: (id: string) => string
  podeAlterar: boolean
  processos: ModuloDeProcessos
  /** Um cartão foi movido: a lista de processos precisa recarregar. */
  aoMudar: () => void
  agrupar: AgruparQuadroPor
}

const COLUNAS_FANTASMA = [0, 1, 2, 3]

export function QuadroDeProcessos({ lista, idEscolhido, enderecoDoProcesso, podeAlterar, processos, aoMudar, agrupar }: QuadroDeProcessosProps) {
  const colunas = agrupar === 'responsavel' ? colunasPorResponsavel(lista.processos) : colunasDoQuadro(lista)
  // O processo some do Quadro (excluído por outra pessoa) é o mesmo que mudou: o Quadro só recarrega.
  const movimento = useMovimentoDoProcesso(processos, aoMudar, aoMudar)
  const arrasto = useArrastoDoQuadro(lista.etapas, movimento.mover)
  return (
    <>
      {movimento.chegada && (
        <JanelaDaChegada chegada={movimento.chegada} processos={processos} aoGravar={aoMudar} aoFechar={movimento.fecharChegada} />
      )}
      {movimento.falha && <p className="cadastros-falha" role="alert">{movimento.falha}</p>}
      <div className="quadro-colunas">
        {colunas.map((coluna) => (
          <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso}
            podeAlterar={podeAlterar && !movimento.gravando} arrasto={arrasto} agrupar={agrupar} etapas={lista.etapas} />
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
