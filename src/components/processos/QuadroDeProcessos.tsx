import { type DragEvent, useEffect, useState } from 'react'
import { useArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { useMovimentoDoProcesso } from '../../hooks/useMovimentoDoProcesso'
import {
  type ColunaDoQuadro as Coluna, colunasDoQuadro, colunasPorResponsavel, colunasPorSetor, quantosForaDoQuadro,
} from '../../processos/colunasDoQuadro'
import type { AgruparQuadroPor, LinhasDoQuadro, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'
import { linhasDoQuadro } from '../../processos/linhasDoQuadro'
import { passoDaRolagemNaBorda } from '../../processos/rolagemDoArrastar'
import type { ListaDeProcessos, ModuloDeProcessos, ProcessoDaLista } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import { AvisoSemProcessoSeu } from './FiltrosDosProcessos'
import { JanelasDoMovimento } from './JanelasDoMovimento'
import { MatrizDoQuadro } from './MatrizDoQuadro'
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
  /** O id de quem está na tela quando o Destacar os meus está ligado: os cartões dos outros ficam esmaecidos. */
  destacarDe: string | null
  /** Só no Quadro por etapa: as colunas das etapas separadas em faixas por setor ou por responsável. */
  linhas: LinhasDoQuadro
  /** Quem está na tela: o cartão dele diz "Você", e as linhas por responsável o chamam assim. */
  usuarioId: string
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
  const { lista, idEscolhido, enderecoDoProcesso, podeAlterar, processos, versoes, aoMudar, agrupar, setorFiltrado, mostrar, destacarDe, enderecoDosConcluidosNaLista, linhas, usuarioId } = props
  const colunas = colunasDoAgrupamento(lista, agrupar, setorFiltrado, mostrar)
  // O processo some do Quadro (excluído por outra pessoa) é o mesmo que mudou: o Quadro só recarrega.
  const movimento = useMovimentoDoProcesso(processos, lista.etapas, aoMudar, aoMudar)
  const arrastoBase = useArrastoDoQuadro(lista.etapas, movimento.mover)
  const [soltouFora, setSoltouFora] = useState(false)
  useEffect(() => {
    if (!soltouFora) return
    const espera = setTimeout(() => setSoltouFora(false), 4000)
    return () => clearTimeout(espera)
  }, [soltouFora])
  // Levantar outro cartão apaga o aviso de "outra linha".
  const arrasto = { ...arrastoBase, levantar: (processo: ProcessoDaLista) => { setSoltouFora(false); arrastoBase.levantar(processo) } }
  const nomesDosSetores = Object.fromEntries(lista.setores.map((setor) => [setor.id, setor.nome]))
  const foraDoQuadro = { quantos: quantosForaDoQuadro(lista.processos), enderecoDaLista: enderecoDosConcluidosNaLista }
  const rolarArrastando = (evento: DragEvent<HTMLElement>) => {
    if (arrasto.levantado) rolarNaBorda(evento.currentTarget, evento.clientX)
  }
  const semProcessoSeu = destacarDe !== null && !colunas.some((coluna) => coluna.processos.some((p) => p.responsavel?.id === destacarDe))
  return (
    <>
      {semProcessoSeu && <AvisoSemProcessoSeu />}
      <JanelasDoMovimento movimento={movimento} processos={processos} versoes={versoes} aoGravar={aoMudar} />
      {soltouFora && <p className="aviso-da-linha" role="status">Solte o cartão na mesma linha.</p>}
      {movimento.falha && <p className="cadastros-falha" role="alert">{movimento.falha}</p>}
      {linhas !== 'nenhuma' && agrupar === 'etapa' ? (
        <MatrizDoQuadro tipo={linhas} colunas={colunas} linhas={linhasDoQuadro(linhas, colunas, lista.setores, usuarioId)}
          idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} podeAlterar={podeAlterar && !movimento.gravando}
          arrasto={arrasto} etapas={lista.etapas} nomesDosSetores={nomesDosSetores} foraDoQuadro={foraDoQuadro}
          destacarDe={destacarDe} usuarioId={usuarioId} aoSoltarFora={() => setSoltouFora(true)} aoPassarArrastando={rolarArrastando} />
      ) : (
        <div className="quadro-colunas" onDragOver={rolarArrastando}>
          {colunas.map((coluna) => (
            <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso}
              podeAlterar={podeAlterar && !movimento.gravando} arrasto={arrasto} agrupar={agrupar} etapas={lista.etapas}
              foraDoQuadro={foraDoQuadro} nomesDosSetores={nomesDosSetores} destacarDe={destacarDe} usuarioId={usuarioId} />
          ))}
        </div>
      )}
    </>
  )
}

// Com o cartão levantado junto a uma borda, o Quadro rola para mostrar as colunas que estão fora da vista.
function rolarNaBorda(quadro: HTMLElement, x: number) {
  const { left, right } = quadro.getBoundingClientRect()
  quadro.scrollLeft += passoDaRolagemNaBorda(x, left, right)
}

export function QuadroCarregando() {
  return (
    <div className="quadro-carregando-bloco" aria-busy="true">
      <p className="quadro-carregando" role="status">Carregando processos…</p>
      <div className="quadro-colunas" aria-hidden="true">
        {COLUNAS_FANTASMA.map((coluna) => <div key={coluna} className="coluna coluna-fantasma" />)}
      </div>
    </div>
  )
}
