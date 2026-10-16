import { type MouseEvent, useState } from 'react'
import { abrirAba, entregarArquivo, fecharAba } from '../../versoes/abrirOuBaixar'
import { textoDaFalhaDoDownload } from '../../versoes/recusasDeVersoes'
import type { ArquivoDaVersao, ModuloDeVersoes } from '../../versoes/tipos'

type LinkDoArquivoProps = { versoes: ModuloDeVersoes; arquivo: ArquivoDaVersao }

/**
 * O nome do arquivo como link de download, para todo perfil ativo. A aba é aberta dentro do clique, antes de esperar
 * a rede (senão o navegador a bloqueia); na falha, a aba é fechada e o aviso aparece abaixo do nome.
 */
export function LinkDoArquivo({ versoes, arquivo }: LinkDoArquivoProps) {
  const [aviso, setAviso] = useState<string | null>(null)

  async function baixar(evento: MouseEvent) {
    evento.preventDefault()
    setAviso(null)
    const aba = abrirAba(arquivo.formato)
    try {
      entregarArquivo(aba, await versoes.baixarArquivo(arquivo), arquivo.nome)
    } catch (erro) {
      fecharAba(aba)
      setAviso(textoDaFalhaDoDownload(erro, arquivo.nome))
    }
  }

  return (
    <>
      <a href="#baixar" onClick={(evento) => void baixar(evento)}>{arquivo.nome}</a>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </>
  )
}
