import { type MouseEvent, useState } from 'react'
import { abrirAba, entregarArquivo, fecharAba } from '../../versoes/abrirOuBaixar'
import { textoDaFalhaDoDownload } from '../../versoes/recusasDeVersoes'
import { Icone, type NomeIcone } from '../Icone'
import type { ArquivoDaVersao, ModuloDeVersoes } from '../../versoes/tipos'

type LinkDoArquivoProps = {
  versoes: ModuloDeVersoes
  arquivo: ArquivoDaVersao
  /** O rótulo curto do destaque ("Fluxograma .bpm"); sem ele, o link mostra o nome do arquivo. */
  rotulo?: string
  /** O nome acessível do botão quando o rótulo visível é só "Baixar" (o do anexo): "Baixar resposta.eml". */
  nomeAcessivel?: string
  /** Sem rótulo, o ícone do tipo vem antes do nome do arquivo (a lista da árvore). */
  icone?: NomeIcone
}

/**
 * O nome do arquivo como link de download, para todo perfil ativo. A aba é aberta dentro do clique, antes de esperar
 * a rede (senão o navegador a bloqueia); na falha, a aba é fechada e o aviso aparece abaixo do nome.
 */
export function LinkDoArquivo({ versoes, arquivo, rotulo, nomeAcessivel, icone }: LinkDoArquivoProps) {
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
      {rotulo
        ? (
            // O nome acessível contém o texto visível e traz o nome do arquivo, que o title também mostra.
            <a href="#baixar" className="arquivo-botao" aria-label={nomeAcessivel ?? `Baixar ${rotulo} (${arquivo.nome})`} title={arquivo.nome}
              onClick={(evento) => void baixar(evento)}>
              <span>{rotulo}</span>
              <Icone nome="baixar" tamanho={16} />
            </a>
          )
        : (
            <a href="#baixar" className={icone ? 'arquivo-com-icone' : undefined} onClick={(evento) => void baixar(evento)}>
              {icone && <Icone nome={icone} tamanho={16} />}
              {arquivo.nome}
            </a>
          )}
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </>
  )
}
