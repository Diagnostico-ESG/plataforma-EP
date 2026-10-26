import { formatarMomento } from '../../acesso/historico'
import type { Anexo } from '../../anexos/tipos'
import type { ConferenciaDosArquivos, ModuloDeVersoes } from '../../versoes/tipos'
import { LinkDoArquivo } from '../versoes/LinkDoArquivo'
import { MarcaNoDrive } from '../versoes/MarcaNoDrive'
import './Anexos.css'

type ListaDeAnexosProps = {
  /** Quem baixa: o módulo de versões (o download do anexo é a mesma ação da função). */
  versoes: ModuloDeVersoes
  /** Do mais recente para o mais antigo. */
  anexos: Anexo[]
  /** O que a conferência com o Drive achou de cada arquivo; sem ela (ainda não respondeu, ou falhou), sem marcas. */
  situacoes?: ConferenciaDosArquivos
  /** Administrador ou Integrante, com o processo em andamento: cada linha ganha [Retirar]. */
  podeRetirar: boolean
  aoPedirRetirada: (anexo: Anexo) => void
}

/** Uma linha por anexo: o nome original, a etapa do envio, quem enviou, o momento, [Baixar] e [Retirar]. O nome longo se corta. */
export function ListaDeAnexos({ versoes, anexos, situacoes, podeRetirar, aoPedirRetirada }: ListaDeAnexosProps) {
  return (
    <ul className="lista-de-anexos">
      {anexos.map((anexo) => (
        <li key={anexo.id}>
          <span className="anexo-nome" title={anexo.nome}>{anexo.nome}</span>
          <span className="anexo-detalhe">{anexo.etapa ?? '—'}</span>
          <span className="anexo-detalhe">{anexo.autor ?? '—'}</span>
          <time className="anexo-data" dateTime={anexo.enviadoEm}>{formatarMomento(anexo.enviadoEm)}</time>
          <MarcaNoDrive situacao={situacoes?.[anexo.id]} />
          <LinkDoArquivo versoes={versoes} arquivo={anexo} rotulo="Baixar" nomeAcessivel={`Baixar ${anexo.nome}`} />
          {podeRetirar && (
            <button type="button" className="anexo-retirar" aria-label={`Retirar ${anexo.nome}`} onClick={() => aoPedirRetirada(anexo)}>
              Retirar
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
