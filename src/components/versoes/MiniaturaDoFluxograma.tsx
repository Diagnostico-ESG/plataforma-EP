import { useState } from 'react'
import { useImagemDoArquivo } from '../../hooks/useImagemDoArquivo'
import { abrirAba, entregarArquivo } from '../../versoes/abrirOuBaixar'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ArquivoDaVersao, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { Icone } from '../Icone'

type MiniaturaDoFluxogramaProps = { modulo: ModuloDeVersoes; versao: Versao; nomeDoProcesso: string }

/** O quadro do verso com a imagem (.png) da versão; sem .png, o ícone do fluxograma e o aviso. */
export function MiniaturaDoFluxograma({ modulo, versao, nomeDoProcesso }: MiniaturaDoFluxogramaProps) {
  const png = versao.arquivos.find(({ papel }) => papel === 'png')
  if (!png) {
    return (
      <div className="versao-destaque-miniatura">
        <Icone nome="fluxograma" tamanho={32} />
        <span>Sem imagem (.png) nesta versão</span>
      </div>
    )
  }
  return <ImagemDaVersao key={png.id} modulo={modulo} png={png} texto={`Fluxograma ${rotuloDaVersao(versao)} de ${nomeDoProcesso}`} />
}

type ImagemDaVersaoProps = { modulo: ModuloDeVersoes; png: ArquivoDaVersao; texto: string }

function ImagemDaVersao({ modulo, png, texto }: ImagemDaVersaoProps) {
  const imagem = useImagemDoArquivo(modulo, png)
  // O conteúdo chegou, mas o navegador não conseguiu desenhá-lo: vale o mesmo aviso de quando a leitura falha.
  const [naoDesenhou, setNaoDesenhou] = useState(false)
  if (imagem.tipo === 'carregando') {
    return <div className="versao-destaque-miniatura versao-destaque-miniatura-carregando" role="status" aria-label="Carregando a imagem" />
  }
  if (imagem.tipo === 'erro' || naoDesenhou) {
    return <div className="versao-destaque-miniatura"><span>Não foi possível carregar a imagem.</span></div>
  }
  // A aba abre dentro do clique, como no link do arquivo; o conteúdo já está aqui, então não há segundo pedido à rede.
  const abrir = () => entregarArquivo(abrirAba(png.formato), imagem.conteudo, png.nome)
  return (
    <button type="button" className="versao-destaque-miniatura versao-destaque-miniatura-botao" title="Abrir o .png inteiro" onClick={abrir}>
      <img src={imagem.endereco} alt={texto} onError={() => setNaoDesenhou(true)} />
    </button>
  )
}
