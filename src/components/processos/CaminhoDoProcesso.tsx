import { useCallback } from 'react'
import { useAcoesDaEtapa } from '../../hooks/useAcoesDaEtapa'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { CaminhoDeEtapas } from './CaminhoDeEtapas'
import { JanelasDaEtapa } from './JanelasDaEtapa'

type CaminhoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  /** Quem está na tela, para a janela de avanço o marcar como responsável. */
  usuarioId: string
  aoMudar: () => void
  aoSumir: () => void
}

// A frase da spec ("Interface"); sem motivo gravado (não deveria acontecer), fica só a explicação.
function avisoDoProcessoParado({ situacao, motivoDaSituacao }: ProcessoLido): string {
  const motivo = motivoDaSituacao ? `: ${motivoDaSituacao}.` : '.'
  return `Este processo está ${situacao}${motivo} Retome-o para registrar o andamento.`
}

/** O caminho do processo no painel, com as ações na etapa atual para quem pode alterar (a RLS é quem protege). */
export function CaminhoDoProcesso({ processo, processos, podeAlterar, usuarioId, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
  // Quem não altera não escolhe responsável: não precisa da lista. Falha ao lê-la deixa o seletor só com o atual.
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const usuarios = estado.tipo === 'pronto' ? estado.valor : []
  const acoes = useAcoesDaEtapa(processos, aoMudar, aoSumir)
  const parado = processo.situacao === 'suspenso' || processo.situacao === 'cancelado'
  return (
    <section className="painel-caminho" aria-label="Caminho de etapas">
      <h3 className="painel-subtitulo">Etapas do processo</h3>
      {parado && <p className="painel-aviso" role="status">{avisoDoProcessoParado(processo)}</p>}
      <CaminhoDeEtapas processos={processos} etapas={processo.etapasDoProcesso} podeAlterar={podeAlterar && !parado}
        usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={processo.ultimaVersao} acoes={acoes} aoMudar={aoMudar}
        aoSumir={aoSumir} />
      {acoes.falha && <p className="cadastros-falha" role="alert">{acoes.falha}</p>}
      <JanelasDaEtapa acoes={acoes} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={processo.ultimaVersao} />
    </section>
  )
}
