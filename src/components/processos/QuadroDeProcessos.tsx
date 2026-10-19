import { useArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { useConclusaoPeloQuadro } from '../../hooks/useConclusaoPeloQuadro'
import { colunasDoQuadro } from '../../processos/colunasDoQuadro'
import type { ListaDeProcessos, ModuloDeProcessos } from '../../processos/tipos'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import { JanelasDaEtapa } from './JanelasDaEtapa'
import './Quadro.css'

type QuadroDeProcessosProps = {
  lista: ListaDeProcessos
  idEscolhido: string | null
  /** O endereço do painel de um processo, com a visão e os filtros de agora. */
  enderecoDoProcesso: (id: string) => string
  podeAlterar: boolean
  processos: ModuloDeProcessos
  /** Quem está na tela: a janela de avanço do arrastar o marca como responsável. */
  usuarioId: string
  /** Um cartão foi concluído: a lista de processos precisa recarregar. */
  aoMudar: () => void
}

const COLUNAS_FANTASMA = [0, 1, 2, 3]

export function QuadroDeProcessos({ lista, idEscolhido, enderecoDoProcesso, podeAlterar, processos, usuarioId, aoMudar }: QuadroDeProcessosProps) {
  const colunas = colunasDoQuadro(lista)
  const { acoes, usuarios, ultimaVersao, falhaDaLeitura, concluirDoCartao } = useConclusaoPeloQuadro(processos, podeAlterar, aoMudar)
  const arrasto = useArrastoDoQuadro(colunas, concluirDoCartao)
  const falha = falhaDaLeitura ?? acoes.falha
  return (
    <>
      {arrasto.aviso && <p className="quadro-aviso" role="status">{arrasto.aviso}</p>}
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <div className="quadro-colunas">
        {colunas.map((coluna) => (
          <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso}
            podeAlterar={podeAlterar} arrasto={arrasto} />
        ))}
      </div>
      <JanelasDaEtapa acoes={acoes} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={ultimaVersao} />
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
