import { useEffect, useState } from 'react'
import type { ArquivoDaVersao, ModuloDeVersoes } from '../versoes/tipos'

export type EstadoDaImagem =
  | { tipo: 'carregando' }
  | { tipo: 'erro' }
  | { tipo: 'pronta'; endereco: string; conteudo: Blob }

/**
 * A imagem do arquivo, pedida ao módulo de versões que já baixa arquivos. Nada é guardado: o endereço temporário nasce quando o
 * conteúdo chega e é liberado ao desmontar. Quem usa troca o `key` pelo id do arquivo, em vez de o hook voltar a "carregando".
 */
export function useImagemDoArquivo(modulo: ModuloDeVersoes, arquivo: ArquivoDaVersao): EstadoDaImagem {
  const [estado, setEstado] = useState<EstadoDaImagem>({ tipo: 'carregando' })

  // Depende só do id: a leitura das versões traz objetos novos a cada atualização, e pedir a imagem de novo faria o quadro piscar.
  useEffect(() => {
    let ativo = true
    let endereco: string | null = null
    async function carregar() {
      try {
        const conteudo = await modulo.baixarArquivo(arquivo)
        if (!ativo) return
        endereco = URL.createObjectURL(conteudo)
        setEstado({ tipo: 'pronta', endereco, conteudo })
      } catch {
        if (ativo) setEstado({ tipo: 'erro' })
      }
    }
    void carregar()
    return () => {
      ativo = false
      if (endereco) URL.revokeObjectURL(endereco)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo, arquivo.id])

  return estado
}
