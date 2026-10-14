import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { type AcaoDaEtapa, acoesDaEtapa, indiceDaEtapaAtual } from '../../processos/caminhoDeEtapas'
import type { EtapaDoSetor, ModuloDeProcessos } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'
import { LinhaDaEtapa } from './LinhaDaEtapa'

type AcaoComNota = Extract<AcaoDaEtapa, 'dispensar' | 'realizada'>
type PedidoDeNota = { acao: AcaoComNota; etapa: EtapaDoSetor }

const JANELA_DA_NOTA: Record<AcaoComNota, { titulo: (nome: string) => string; rotuloDaAcao: string }> = {
  dispensar: { titulo: (nome) => `Dispensar a etapa ${nome}?`, rotuloDaAcao: 'Dispensar' },
  realizada: { titulo: (nome) => `Registrar a etapa ${nome} como realizada anteriormente?`, rotuloDaAcao: 'Registrar' },
}

/** Etapa do setor ou do processo: só a do processo traz o nome do responsável. */
type EtapaDoCaminho = EtapaDoSetor & { responsavelNome?: string | null }

type CaminhoDeEtapasProps = {
  processos: ModuloDeProcessos
  etapas: EtapaDoCaminho[]
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

/** O caminho de etapas (do setor ou do processo): só a etapa atual tem ações; Dispensar e Realizada anteriormente pedem nota. */
export function CaminhoDeEtapas({ processos, etapas, podeAlterar, aoMudar, aoSumir }: CaminhoDeEtapasProps) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [pedido, setPedido] = useState<PedidoDeNota | null>(null)
  const atual = indiceDaEtapaAtual(etapas)

  function agir(acao: AcaoDaEtapa, etapa: EtapaDoSetor) {
    if (acao === 'dispensar' || acao === 'realizada') return setPedido({ acao, etapa })
    const gravar = acao === 'iniciar' ? () => processos.iniciarEtapa(etapa.id) : () => processos.concluirEtapa(etapa.id)
    executar(gravar, aoMudar)
  }

  // A janela fecha antes de confirmar; o pedido lido aqui é o desta renderização, ainda preenchido.
  function gravarComNota(nota: string) {
    if (!pedido) return
    const { acao, etapa } = pedido
    const gravar = acao === 'dispensar'
      ? () => processos.dispensarEtapa(etapa.id, nota)
      : () => processos.registrarRealizadaAnteriormente(etapa.id, nota)
    executar(gravar, aoMudar)
  }

  const janela = pedido ? JANELA_DA_NOTA[pedido.acao] : null
  return (
    <>
      <ol className="caminho-de-etapas">
        {etapas.map((etapa, indice) => (
          <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={indice === atual}
            acoes={podeAlterar ? acoesDaEtapa(etapas, indice) : []} aoAgir={(acao) => agir(acao, etapa)}
            responsavelNome={etapa.responsavelNome} />
        ))}
      </ol>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaComCampo aberta={pedido !== null} titulo={janela && pedido ? janela.titulo(pedido.etapa.nome) : ''}
        rotuloDoCampo="Nota" rotuloDaAcao={janela?.rotuloDaAcao ?? ''}
        aoConfirmar={gravarComNota} aoFechar={() => setPedido(null)} />
    </>
  )
}
