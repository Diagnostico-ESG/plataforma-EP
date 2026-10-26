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
}

/** Uma linha por anexo: o nome original, a etapa do envio, quem enviou, o momento e [Baixar]. O nome longo se corta. */
export function ListaDeAnexos({ versoes, anexos, situacoes }: ListaDeAnexosProps) {
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
        </li>
      ))}
    </ul>
  )
}
