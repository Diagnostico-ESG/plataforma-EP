import { useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { ModuloDeCadastros, Setor } from '../../cadastros/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

// Neste ticket o setor ainda não tem macroprocessos; o ticket 04 passa a contá-los no texto.
const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

type AcoesDoSetorProps = {
  cadastros: ModuloDeCadastros
  setor: Setor
  aoMudar: () => void
  aoSumir: () => void
  aoVoltar: () => void
}

export function AcoesDoSetor({ cadastros, setor, aoMudar, aoSumir, aoVoltar }: AcoesDoSetorProps) {
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

  const alternarAtivo = () =>
    executar(() => (setor.ativo ? cadastros.desativarSetor(setor.id) : cadastros.reativarSetor(setor.id)), aoMudar)
  const excluir = () => executar(() => cadastros.excluirSetor(setor.id), aoVoltar)

  return (
    <div className="acoes-do-setor">
      <button type="button" className="botao botao-secundario" onClick={alternarAtivo}>
        {setor.ativo ? 'Desativar' : 'Reativar'}
      </button>
      <button type="button" className="botao botao-secundario" onClick={() => setConfirmando(true)}>Excluir</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Excluir o setor ${setor.sigla}?`} texto={TEXTO_DA_EXCLUSAO}
        rotuloDaAcao="Excluir setor" aoConfirmar={excluir} aoFechar={() => setConfirmando(false)} />
    </div>
  )
}
