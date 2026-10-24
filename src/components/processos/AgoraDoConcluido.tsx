import type { Executar } from '../../hooks/useGravacaoComFalha'
import { linhaDaPublicacao } from '../../processos/publicacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'

type AcoesDoConcluidoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** Arquivar e Desarquivar gravam na hora e a falha aparece no verso. */
  executar: Executar
  aoMudar: () => void
}

/**
 * O que o processo concluído (na etapa Concluídos) acrescenta ao Agora: a linha da publicação e [Arquivar]. A janela da
 * chegada, o registro da publicação e o arquivamento do suspenso e do cancelado chegam no ticket 04 de
 * publicacao-e-arquivamento.
 */
export function AcoesDoConcluido({ processo, processos, executar, aoMudar }: AcoesDoConcluidoProps) {
  const publicacao = linhaDaPublicacao(processo)
  return (
    <>
      {publicacao && <p className="agora-publicacao">{publicacao}</p>}
      <div className="agora-botoes">
        <button type="button" className="botao botao-secundario" onClick={() => executar(() => processos.arquivar(processo.id), aoMudar)}>
          Arquivar
        </button>
      </div>
    </>
  )
}

type AgoraDoArquivadoProps = AcoesDoConcluidoProps & { podeAlterar: boolean }

/** O Agora do arquivado: só diz que está arquivado e, para quem altera, oferece [Desarquivar] (ADR 0020). */
export function AgoraDoArquivado({ processo, processos, podeAlterar, executar, aoMudar }: AgoraDoArquivadoProps) {
  const publicacao = linhaDaPublicacao(processo)
  return (
    <>
      <p className="agora-situacao">Arquivado</p>
      {publicacao && <p className="agora-publicacao">{publicacao}</p>}
      {podeAlterar && (
        <div className="agora-botoes">
          <button type="button" className="botao botao-principal" onClick={() => executar(() => processos.desarquivar(processo.id), aoMudar)}>
            Desarquivar
          </button>
        </div>
      )}
    </>
  )
}
