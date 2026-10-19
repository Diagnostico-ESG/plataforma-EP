import './Agora.css'
import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import { indiceDaEtapaAtual, rotuloDoAgora } from '../../processos/caminhoDeEtapas'
import type { ProcessoLido, UsuarioResponsavel } from '../../processos/tipos'
import { EtapaDoAgora } from './EtapaDoAgora'

type AgoraDoProcessoProps = {
  processo: ProcessoLido
  usuarios: UsuarioResponsavel[]
  /** Quem está na tela. */
  usuarioId: string
  podeAlterar: boolean
  acoes: AcoesDaEtapaEmUso
}

/** O cartão "Agora": o que há a fazer no processo, no alto da coluna esquerda do verso (spec, "Coluna esquerda — Agora"). */
export function AgoraDoProcesso({ processo, usuarios, usuarioId, podeAlterar, acoes }: AgoraDoProcessoProps) {
  const etapas = processo.etapasDoProcesso
  const indice = indiceDaEtapaAtual(etapas)
  if (indice === -1) return null
  return (
    <section className={podeAlterar ? 'agora' : 'agora agora-leitura'} aria-label={rotuloDoAgora(indice, etapas.length)}>
      <EtapaDoAgora etapas={etapas} indice={indice} podeAlterar={podeAlterar} usuarios={usuarios} usuarioId={usuarioId}
        ultimaVersao={processo.ultimaVersao} acoes={acoes} />
    </section>
  )
}
