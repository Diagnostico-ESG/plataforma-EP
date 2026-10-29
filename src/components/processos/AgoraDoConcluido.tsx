import { textoDaPublicacaoNoAgora } from '../../processos/publicacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { BotaoDaPublicacao, LinhaDaPublicacao } from './AgoraDaPublicacao'

type AcoesDoConcluidoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  aoMudar: () => void
}

/**
 * O que o processo em Concluídos acrescenta ao Agora: a linha da publicação (a data ou a explicação) e [Registrar
 * publicação] ou [Corrigir publicação].
 */
export function AcoesDoConcluido({ processo, processos, aoMudar }: AcoesDoConcluidoProps) {
  const texto = textoDaPublicacaoNoAgora(processo)
  return (
    <>
      {texto && <LinhaDaPublicacao texto={texto} link={processo.linkDaPublicacao} />}
      <div className="agora-botoes">
        <BotaoDaPublicacao processo={processo} processos={processos} aoMudar={aoMudar} />
      </div>
    </>
  )
}
