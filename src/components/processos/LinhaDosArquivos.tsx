import type { CSSProperties } from 'react'
import '../versoes/VersaoEmDestaque.css'
import './ArvoreDaLista.css'
import type { EstadoDosArquivos } from '../../hooks/useArquivosDosProcessos'
import { COLUNAS_DA_LISTA } from '../../processos/colunasDaLista'
import { arquivosDaVersaoMaisRecente } from '../../versoes/arquivosDaArvore'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Pilula } from '../Pilula'
import { LinkDoArquivo } from '../versoes/LinkDoArquivo'
import { SeloDoTipoDeArquivo } from '../versoes/SeloDoTipoDeArquivo'

type ConteudoProps = { estado: EstadoDosArquivos | undefined; modulo: ModuloDeVersoes; aoTentarDeNovo: () => void }
/** `nivel` é o do processo dono dos arquivos: a linha vem um passo à frente dele. */
type LinhaDosArquivosProps = ConteudoProps & { nivel: number }

/** A linha logo abaixo do processo aberto: a versão mais recente, o selo "Aprovada" e, em lista, um link por arquivo com o nome completo. */
export function LinhaDosArquivos({ nivel, ...conteudo }: LinhaDosArquivosProps) {
  return (
    <tr className="linha-dos-arquivos">
      <td colSpan={COLUNAS_DA_LISTA.length} style={{ '--nivel': nivel } as CSSProperties}>
        <ConteudoDosArquivos {...conteudo} />
      </td>
    </tr>
  )
}

function ConteudoDosArquivos({ estado, modulo, aoTentarDeNovo }: ConteudoProps) {
  if (!estado || estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando arquivos…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os arquivos" aoTentarDeNovo={aoTentarDeNovo} />
  const arquivos = arquivosDaVersaoMaisRecente(estado.versoes)
  if (!arquivos) return <p className="cadastros-vazio">Sem versão ainda.</p>
  return (
    <div className="arquivos-da-arvore">
      <strong>{arquivos.rotulo}</strong>
      {arquivos.aprovada && <Pilula situacao="aprovado">Aprovada</Pilula>}
      <ul className="arquivos-em-lista">
        {arquivos.arquivos.map(({ arquivo }) => (
          <li key={arquivo.id}>
            <SeloDoTipoDeArquivo formato={arquivo.formato} />
            <LinkDoArquivo versoes={modulo} arquivo={arquivo} />
          </li>
        ))}
      </ul>
    </div>
  )
}
