import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { ModuloDeProcessos, ProcessoLido, Reclassificacao } from '../../processos/tipos'
import { JanelaDeReclassificacao } from './JanelaDeReclassificacao'

type AcoesDeReclassificacaoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** O tipo mudou: o painel e o Quadro precisam recarregar. */
  aoMudar: () => void
  aoSumir: () => void
}

/** [Reclassificar] com a janela do novo tipo, do pai e do motivo. */
export function AcoesDeReclassificacao({ processo, processos, aoMudar, aoSumir }: AcoesDeReclassificacaoProps) {
  const [aberta, setAberta] = useState(false)
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const confirmar = (reclassificacao: Reclassificacao, motivo: string) =>
    executar(() => processos.reclassificarProcesso(processo.id, reclassificacao, motivo), aoMudar)
  return (
    <>
      <button type="button" className="botao botao-secundario" onClick={() => setAberta(true)}>Reclassificar</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      {aberta && (
        <JanelaDeReclassificacao processo={processo} processos={processos} aoConfirmar={confirmar}
          aoFechar={() => setAberta(false)} />
      )}
    </>
  )
}
