import { useTirarDoQuadroDaTela } from '../../hooks/useTirarDoQuadro'
import { textoDaPublicacaoNoAgora } from '../../processos/publicacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { BotaoDaPublicacao, LinhaDaPublicacao } from './AgoraDaPublicacao'

type AcoesDoConcluidoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  aoMudar: () => void
}

/**
 * O que o processo em Concluídos acrescenta ao Agora: a linha da publicação (a data ou a explicação), [Registrar
 * publicação] ou [Corrigir publicação] e, enquanto o cartão está no Quadro, [Tirar do Quadro].
 */
export function AcoesDoConcluido({ processo, processos, aoMudar }: AcoesDoConcluidoProps) {
  const texto = textoDaPublicacaoNoAgora(processo)
  const tirar = useTirarDoQuadroDaTela()
  return (
    <>
      {texto && <LinhaDaPublicacao texto={texto} link={processo.linkDaPublicacao} />}
      <div className="agora-botoes">
        <BotaoDaPublicacao processo={processo} processos={processos} aoMudar={aoMudar} />
        {tirar && processo.noQuadro !== false && (
          <button type="button" className="botao botao-secundario" onClick={() => tirar({ id: processo.id, nome: processo.nome }, aoMudar)}>
            Tirar do Quadro
          </button>
        )}
      </div>
    </>
  )
}
