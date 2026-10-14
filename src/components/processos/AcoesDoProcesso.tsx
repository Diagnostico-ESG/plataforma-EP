import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { AcoesDeSituacao } from './AcoesDeSituacao'

type AcoesDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  aoEditar: () => void
  aoExcluir: () => void
  aoMudar: () => void
  aoSumir: () => void
}

const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer.'

/** Ações de situação, [Editar] e [Excluir] (com janela de confirmação): só para quem pode alterar; a RLS é quem protege. */
export function AcoesDoProcesso({ processo, processos, aoEditar, aoExcluir, aoMudar, aoSumir }: AcoesDoProcessoProps) {
  const [confirmando, setConfirmando] = useState(false)
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  return (
    <div className="painel-acoes">
      <AcoesDeSituacao processo={processo} processos={processos} aoMudar={aoMudar} aoSumir={aoSumir} />
      <button type="button" className="botao botao-secundario" onClick={aoEditar}>Editar</button>
      <button type="button" className="botao botao-secundario" onClick={() => setConfirmando(true)}>Excluir</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Excluir o processo ${processo.nome}?`} texto={TEXTO_DA_EXCLUSAO}
        rotuloDaAcao="Excluir processo" aoConfirmar={() => executar(() => processos.excluirProcesso(processo.id), aoExcluir)}
        aoFechar={() => setConfirmando(false)} />
    </div>
  )
}
