import { useState } from 'react'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { concluidoEm, formatarData } from '../../processos/caminhoDeEtapas'
import { linhaDaPublicacao, naoPublicado } from '../../processos/publicacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { JanelaDaPublicacao } from './JanelaDaPublicacao'

type AgoraDoConcluidoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  /** A data da aprovação (AAAA-MM-DD), o mínimo da publicação registrada; null sem data. */
  aprovadaEm: string | null
  /** Arquivar e Desarquivar gravam na hora e a falha aparece no verso. */
  executar: Executar
  aoMudar: () => void
  aoSumir: () => void
}

function textoDoConcluido({ etapasDoProcesso }: ProcessoLido): string {
  const data = concluidoEm(etapasDoProcesso)
  return data ? `Concluído em ${formatarData(data)}` : 'Concluído'
}

/**
 * O Agora do processo concluído (ADR 0020): quando terminou ou "Arquivado", se foi publicado e, para quem altera,
 * [Arquivar] ou [Desarquivar] e, no não publicado, [Registrar publicação]. O arquivado não oferece outra alteração.
 */
export function AgoraDoConcluido({ processo, processos, podeAlterar, aprovadaEm, executar, aoMudar, aoSumir }: AgoraDoConcluidoProps) {
  const [registrando, setRegistrando] = useState(false)
  const arquivado = Boolean(processo.arquivadoEm)
  const publicacao = linhaDaPublicacao(processo)
  const arquivarOuDesarquivar = () =>
    executar(() => (arquivado ? processos.desarquivar(processo.id) : processos.arquivar(processo.id)), aoMudar)
  return (
    <>
      <p className="agora-situacao">{arquivado ? 'Arquivado' : textoDoConcluido(processo)}</p>
      {publicacao && <p className="agora-publicacao">{publicacao}</p>}
      {podeAlterar && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-principal" onClick={arquivarOuDesarquivar}>
            {arquivado ? 'Desarquivar' : 'Arquivar'}
          </button>
          {naoPublicado(processo) && (
            <button type="button" className="botao botao-secundario" onClick={() => setRegistrando(true)}>Registrar publicação</button>
          )}
        </div>
      )}
      {registrando && (
        <JanelaDaPublicacao processoId={processo.id} processos={processos} aprovadaEm={aprovadaEm} aoGravar={aoMudar}
          aoSumir={aoSumir} aoFechar={() => setRegistrando(false)} />
      )}
    </>
  )
}
