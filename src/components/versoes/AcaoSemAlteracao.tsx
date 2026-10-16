import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

type AcaoSemAlteracaoProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  /** O rótulo da versão anterior, de onde o relatório será copiado. */
  rotuloDaOrigem: string
  aoConcluir: () => void
}

/** [Sem alteração de conteúdo] com confirmação: a função copia no Drive o relatório da versão anterior. */
export function AcaoSemAlteracao({ modulo, processoId, versao, rotuloDaOrigem, aoConcluir }: AcaoSemAlteracaoProps) {
  const [confirmando, setConfirmando] = useState(false)
  const { falha, executar } = useGravacaoComFalha(aoConcluir)
  const rotulo = rotuloDaVersao(versao)
  return (
    <div className="painel-acoes">
      <button type="button" className="botao botao-secundario" onClick={() => setConfirmando(true)}>Sem alteração de conteúdo</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Marcar a ${rotulo} como sem alteração de conteúdo?`}
        texto={`O relatório da ${rotuloDaOrigem} será copiado para a ${rotulo}, com o nome da ${rotulo}.`} rotuloDaAcao="Copiar relatório"
        aoConfirmar={() => executar(() => modulo.semAlteracaoDeConteudo(processoId, versao.id), aoConcluir)}
        aoFechar={() => setConfirmando(false)} />
    </div>
  )
}
