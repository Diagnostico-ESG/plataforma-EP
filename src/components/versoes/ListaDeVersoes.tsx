import { formatarMomento } from '../../acesso/historico'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { LinkDoArquivo } from './LinkDoArquivo'

/** As versões, da mais recente para a mais antiga; cada uma é um bloco com o cabeçalho e os arquivos. */
export function ListaDeVersoes({ modulo, versoes }: { modulo: ModuloDeVersoes; versoes: Versao[] }) {
  if (versoes.length === 0) return <p className="cadastros-vazio">Nenhuma versão enviada.</p>
  return (
    <ol className="lista-de-versoes">
      {versoes.map((versao) => <BlocoDaVersao key={versao.id} modulo={modulo} versao={versao} />)}
    </ol>
  )
}

function BlocoDaVersao({ modulo, versao }: { modulo: ModuloDeVersoes; versao: Versao }) {
  const rotulo = rotuloDaVersao(versao)
  return (
    <li className="bloco-da-versao" aria-label={rotulo}>
      <p className="bloco-da-versao-cabecalho">
        <strong>{rotulo}</strong>
        <time dateTime={versao.enviadaEm}>{formatarMomento(versao.enviadaEm)}</time>
        <span>{versao.autor ?? '—'}</span>
        {versao.etapa && <span>{versao.etapa}</span>}
      </p>
      {versao.observacao && <p className="bloco-da-versao-observacao">{versao.observacao}</p>}
      <ul className="bloco-da-versao-arquivos">
        {versao.arquivos.map((arquivo) => <li key={arquivo.id}><LinkDoArquivo versoes={modulo} arquivo={arquivo} /></li>)}
      </ul>
    </li>
  )
}
