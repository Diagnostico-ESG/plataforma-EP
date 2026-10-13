import { useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

type AcoesDoCadastroProps = {
  ativo: boolean
  tituloDaJanela: string
  textoDaJanela: string
  rotuloDaExclusao: string
  desativar: () => Promise<void>
  reativar: () => Promise<void>
  excluir: () => Promise<void>
  aoMudar: () => void
  aoSumir: () => void
  aoVoltar: () => void
}

/** Desativar/Reativar e Excluir (com janela) de qualquer cadastro; quem chama diz o que gravar e o que a janela diz. */
export function AcoesDoCadastro({
  ativo, tituloDaJanela, textoDaJanela, rotuloDaExclusao, desativar, reativar, excluir, aoMudar, aoSumir, aoVoltar,
}: AcoesDoCadastroProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  async function executar(gravar: () => Promise<void>, depois: () => void) {
    setFalha(null)
    try {
      await gravar()
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      return setFalha(textoDaFalha(erro))
    }
    depois()
  }

  return (
    <div className="acoes-do-setor">
      <button type="button" className="botao botao-secundario"
        onClick={() => executar(ativo ? desativar : reativar, aoMudar)}>
        {ativo ? 'Desativar' : 'Reativar'}
      </button>
      <button type="button" className="botao botao-secundario" onClick={() => setConfirmando(true)}>Excluir</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={confirmando} titulo={tituloDaJanela} texto={textoDaJanela}
        rotuloDaAcao={rotuloDaExclusao} aoConfirmar={() => executar(excluir, aoVoltar)}
        aoFechar={() => setConfirmando(false)} />
    </div>
  )
}
