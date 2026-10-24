import type { Executar } from '../../hooks/useGravacaoComFalha'
import { textoDaPublicacaoNoAgora, textoDaPublicacaoNoArquivado } from '../../processos/publicacao'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { BotaoDaPublicacao, LinhaDaPublicacao } from './AgoraDaPublicacao'

type AcoesDoConcluidoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** Arquivar e Desarquivar gravam na hora e a falha aparece no verso. */
  executar: Executar
  aoMudar: () => void
}

/**
 * O que o processo em Concluídos acrescenta ao Agora: a linha da publicação (a data ou a explicação), [Registrar publicação]
 * ou [Corrigir publicação] e [Arquivar], que é o botão principal.
 */
export function AcoesDoConcluido({ processo, processos, executar, aoMudar }: AcoesDoConcluidoProps) {
  const texto = textoDaPublicacaoNoAgora(processo)
  return (
    <>
      {texto && <LinhaDaPublicacao texto={texto} link={processo.linkDaPublicacao} />}
      <div className="agora-botoes">
        <BotaoDaPublicacao processo={processo} processos={processos} aoMudar={aoMudar} />
        <button type="button" className="botao botao-principal" onClick={() => executar(() => processos.arquivar(processo.id), aoMudar)}>
          Arquivar
        </button>
      </div>
    </>
  )
}

type AgoraDoArquivadoProps = AcoesDoConcluidoProps & { podeAlterar: boolean }

/** "Arquivado" e, no suspenso e no cancelado, a situação e o motivo que ele guardou. */
function situacaoDoArquivado({ situacao, motivoDaSituacao }: ProcessoLido): string {
  if (situacao !== 'suspenso' && situacao !== 'cancelado') return 'Arquivado'
  const rotulo = `Arquivado · ${ROTULO_DA_SITUACAO[situacao]}`
  return motivoDaSituacao ? `${rotulo}: ${motivoDaSituacao}` : rotulo
}

/**
 * O Agora do arquivado: a situação que ele guardou, a publicação e, para quem altera, [Registrar publicação] (só sem a
 * data) e [Desarquivar]. Não há outro botão de alteração (ADR 0024).
 */
export function AgoraDoArquivado({ processo, processos, podeAlterar, executar, aoMudar }: AgoraDoArquivadoProps) {
  const texto = textoDaPublicacaoNoArquivado(processo)
  return (
    <>
      <p className="agora-situacao">{situacaoDoArquivado(processo)}</p>
      {texto && <LinhaDaPublicacao texto={texto} link={processo.linkDaPublicacao} />}
      {podeAlterar && (
        <div className="agora-botoes">
          <BotaoDaPublicacao processo={processo} processos={processos} aoMudar={aoMudar} />
          <button type="button" className="botao botao-principal" onClick={() => executar(() => processos.desarquivar(processo.id), aoMudar)}>
            Desarquivar
          </button>
        </div>
      )}
    </>
  )
}
