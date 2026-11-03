import { useEffect, useState } from 'react'
import type { ArquivoDaVersao, ModuloDeVersoes } from '../versoes/tipos'

export type EstadoDaImagem =
  | { tipo: 'carregando' }
  | { tipo: 'erro' }
  | { tipo: 'pronta'; endereco: string; conteudo: Blob }

// Guardada por módulo (o do app é um só; cada teste cria o seu, então um não vê o conteúdo do outro) e por id do arquivo, que muda a
// cada versão enviada: a cópia nunca fica velha. Guarda a promessa, para dois pedidos juntos do mesmo arquivo virarem um só.
// ponytail: sem limite de tamanho, os .png ficam na memória até recarregar a página (poucos por sessão); limitar por quantidade se pesar.
const conteudosGuardados = new WeakMap<ModuloDeVersoes, Map<string, Promise<Blob>>>()

function conteudoDoArquivo(modulo: ModuloDeVersoes, arquivo: ArquivoDaVersao): Promise<Blob> {
  const guardados = conteudosGuardados.get(modulo) ?? new Map<string, Promise<Blob>>()
  conteudosGuardados.set(modulo, guardados)
  const guardado = guardados.get(arquivo.id)
  if (guardado) return guardado
  const pedido = modulo.baixarArquivo(arquivo)
  guardados.set(arquivo.id, pedido)
  // Falha não fica guardada: a próxima abertura tenta de novo.
  pedido.catch(() => {
    if (guardados.get(arquivo.id) === pedido) guardados.delete(arquivo.id)
  })
  return pedido
}

/**
 * A imagem do arquivo, pedida ao módulo de versões que já baixa arquivos e guardada na memória até a página ser recarregada. O endereço
 * temporário nasce quando o conteúdo chega e é liberado ao desmontar. Quem usa troca o `key` pelo id do arquivo, em vez de o hook voltar a "carregando".
 */
export function useImagemDoArquivo(modulo: ModuloDeVersoes, arquivo: ArquivoDaVersao): EstadoDaImagem {
  const [estado, setEstado] = useState<EstadoDaImagem>({ tipo: 'carregando' })

  // Depende só do id: a leitura das versões traz objetos novos a cada atualização, e pedir a imagem de novo faria o quadro piscar.
  useEffect(() => {
    let ativo = true
    let endereco: string | null = null
    async function carregar() {
      try {
        const conteudo = await conteudoDoArquivo(modulo, arquivo)
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
