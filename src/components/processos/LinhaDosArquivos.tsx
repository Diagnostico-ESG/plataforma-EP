import '../versoes/VersaoEmDestaque.css'
import './ArvoreDaLista.css'
import type { EstadoDosArquivos } from '../../hooks/useArquivosDosProcessos'
import { COLUNAS_DA_LISTA } from '../../processos/colunasDaLista'
import { arquivosDaVersaoMaisRecente } from '../../versoes/arquivosDaArvore'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Pilula } from '../Pilula'
import { LinkDoArquivo } from '../versoes/LinkDoArquivo'

type LinhaDosArquivosProps = { estado: EstadoDosArquivos | undefined; modulo: ModuloDeVersoes; aoTentarDeNovo: () => void }

/** A linha logo abaixo do processo aberto: a versão mais recente, o selo "Aprovada" e um link por arquivo, que abre no Drive. */
export function LinhaDosArquivos({ estado, modulo, aoTentarDeNovo }: LinhaDosArquivosProps) {
  return (
    <tr className="linha-dos-arquivos">
      <td colSpan={COLUNAS_DA_LISTA.length}>
        <ConteudoDosArquivos estado={estado} modulo={modulo} aoTentarDeNovo={aoTentarDeNovo} />
      </td>
    </tr>
  )
}

function ConteudoDosArquivos({ estado, modulo, aoTentarDeNovo }: LinhaDosArquivosProps) {
  if (!estado || estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando arquivos…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os arquivos" aoTentarDeNovo={aoTentarDeNovo} />
  const arquivos = arquivosDaVersaoMaisRecente(estado.versoes)
  if (!arquivos) return <p className="cadastros-vazio">Sem versão ainda.</p>
  return (
    <div className="arquivos-da-arvore">
      <strong>{arquivos.rotulo}</strong>
      {arquivos.aprovada && <Pilula situacao="aprovado">Aprovada</Pilula>}
      <ul className="arquivos-do-destaque">
        {arquivos.arquivos.map(({ arquivo, rotulo }) => (
          <li key={arquivo.id} className={`arquivo-do-destaque arquivo-${arquivo.papel === 'relatorio' ? 'relatorio' : 'fluxograma'}`}>
            <LinkDoArquivo versoes={modulo} arquivo={arquivo} rotulo={rotulo} />
          </li>
        ))}
      </ul>
    </div>
  )
}
