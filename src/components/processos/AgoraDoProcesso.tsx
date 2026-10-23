import './Agora.css'
import { useState } from 'react'
import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { indiceDaEtapaAtual, rotuloDoAgora } from '../../processos/caminhoDeEtapas'
import type { PedidoDeSituacao } from '../../processos/pedidosDeSituacao'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import type { ModuloDeProcessos, ProcessoLido, UsuarioResponsavel } from '../../processos/tipos'
import { JanelaDeSituacao } from './AcoesDeSituacao'
import { AgoraDoConcluido } from './AgoraDoConcluido'
import { EtapaDoAgora } from './EtapaDoAgora'

type AgoraDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  usuarios: UsuarioResponsavel[]
  /** Quem está na tela. */
  usuarioId: string
  podeAlterar: boolean
  acoes: AcoesDaEtapaEmUso
  /** Grava a situação (Retomar), o arquivamento e a desistência da publicação, e guarda a falha para o verso mostrar. */
  executar: Executar
  /** A data da aprovação (AAAA-MM-DD), o mínimo da publicação registrada; null sem data. */
  aprovadaEm: string | null
  aoMudar: () => void
  aoSumir: () => void
}

/**
 * O cartão "Agora": o que há a fazer no processo, no alto da coluna esquerda do verso (spec, "Coluna esquerda — Agora").
 * Suspenso e cancelado trocam a etapa pelo motivo e [Retomar]; concluído não tem etapa atual: diz quando terminou (ou
 * que está arquivado), se foi publicado, e oferece arquivar ou desarquivar e registrar a publicação (ADR 0020).
 */
export function AgoraDoProcesso(props: AgoraDoProcessoProps) {
  const { processo, processos, usuarios, usuarioId, podeAlterar, acoes, executar, aoMudar } = props
  const [pedido, setPedido] = useState<PedidoDeSituacao | null>(null)
  const etapas = processo.etapasDoProcesso
  const indice = indiceDaEtapaAtual(etapas)
  const { situacao } = processo
  const parado = situacao === 'suspenso' || situacao === 'cancelado'
  const concluido = situacao === 'concluido'
  if (!parado && !concluido && indice === -1) return null
  const corpo = indice === -1 || situacao !== 'em_andamento' ? null : (
    <EtapaDoAgora etapas={etapas} indice={indice} podeAlterar={podeAlterar} usuarios={usuarios} usuarioId={usuarioId}
      ultimaVersao={processo.ultimaVersao} acoes={acoes} aoDesistirDaPublicacao={() => setPedido('nao_publicar')} />
  )
  return (
    <section className={classeDoAgora(situacao, podeAlterar)} aria-label={parado ? 'Agora' : rotuloDoAgora(indice, etapas.length)}>
      {parado && <SituacaoParada processo={processo} podeAlterar={podeAlterar} aoRetomar={() => setPedido('retomar')} />}
      {concluido && <AgoraDoConcluido {...props} />}
      {corpo}
      <JanelaDeSituacao processo={processo} processos={processos} pedido={pedido} executar={executar}
        aoFechar={() => setPedido(null)} aoMudar={aoMudar} />
    </section>
  )
}

function classeDoAgora(situacao: ProcessoLido['situacao'], podeAlterar: boolean): string {
  if (situacao !== 'em_andamento') return `agora agora-${situacao}`
  return podeAlterar ? 'agora' : 'agora agora-leitura'
}

type SituacaoParadaProps = { processo: ProcessoLido; podeAlterar: boolean; aoRetomar: () => void }

function SituacaoParada({ processo, podeAlterar, aoRetomar }: SituacaoParadaProps) {
  const rotulo = ROTULO_DA_SITUACAO[processo.situacao]
  return (
    <>
      <p className="agora-rotulo">Agora</p>
      <p className="agora-situacao">{processo.motivoDaSituacao ? `${rotulo}: ${processo.motivoDaSituacao}` : rotulo}</p>
      {podeAlterar && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-principal" onClick={aoRetomar}>Retomar</button>
        </div>
      )}
    </>
  )
}
