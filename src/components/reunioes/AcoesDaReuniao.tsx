import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { ROTULO_DO_TIPO_DE_REUNIAO } from '../../reunioes/rotulos'
import type { ModuloDeReunioes, Reuniao } from '../../reunioes/tipos'
import { formatarData } from '../../processos/caminhoDeEtapas'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

type AcoesDaReuniaoProps = {
  reuniao: Reuniao
  reunioes: ModuloDeReunioes
  aoEditar: () => void
  aoExcluir: () => void
  aoSumir: () => void
}

const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ela tinha, mas não é possível desfazer.'

function tituloDaExclusao({ tipo, data }: Reuniao): string {
  return `Excluir a reunião de ${ROTULO_DO_TIPO_DE_REUNIAO[tipo].toLowerCase()} de ${formatarData(data)}?`
}

/** [Editar] e [Excluir] (com janela de confirmação): só para quem pode alterar; quem protege os dados é a RLS. */
export function AcoesDaReuniao({ reuniao, reunioes, aoEditar, aoExcluir, aoSumir }: AcoesDaReuniaoProps) {
  const [confirmando, setConfirmando] = useState(false)
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  return (
    <div className="painel-acoes">
      <button type="button" className="botao botao-secundario" onClick={aoEditar}>Editar</button>
      <button type="button" className="botao botao-secundario" onClick={() => setConfirmando(true)}>Excluir</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={confirmando} titulo={tituloDaExclusao(reuniao)} texto={TEXTO_DA_EXCLUSAO}
        rotuloDaAcao="Excluir reunião" aoConfirmar={() => executar(() => reunioes.excluirReuniao(reuniao.id), aoExcluir)}
        aoFechar={() => setConfirmando(false)} />
    </div>
  )
}
