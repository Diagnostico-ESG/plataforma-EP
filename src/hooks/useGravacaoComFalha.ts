import { useState } from 'react'
import { textoDaFalha } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'

/**
 * Roda uma gravação e guarda a mensagem de falha para a tela mostrar ao lado do botão.
 * Item que sumiu (excluído por outra pessoa) não é falha: avisa por `aoSumir`.
 */
export function useGravacaoComFalha(aoSumir: () => void) {
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

  return { falha, executar }
}
