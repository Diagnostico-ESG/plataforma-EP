import { formatarMomento } from '../../acesso/historico'
import { origemDoRelatorio, podeCopiarRelatorio, relatorioPendente, rotuloDaAnterior, rotuloDaVersao } from '../../versoes/rotulos'
import type { ConferenciaDosArquivos, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { Pilula } from '../Pilula'
import { AcaoSemAlteracao } from './AcaoSemAlteracao'
import { AcaoSubstituir } from './AcaoSubstituir'
import { LinkDoArquivo } from './LinkDoArquivo'
import { MarcaNoDrive } from './MarcaNoDrive'

type ListaDeVersoesProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versoes: Versao[]
  /** Todas as versões do processo: a origem do relatório copiado e a versão anterior podem estar fora da lista. */
  todas: Versao[]
  /** Administrador ou Integrante, com o processo em andamento (quem recusa é a função do servidor e o banco). */
  podeAlterar: boolean
  aoAlterada: () => void
  /** O que a conferência com o Drive achou de cada arquivo; sem ela (ainda não respondeu, ou falhou), sem marcas. */
  situacoes?: ConferenciaDosArquivos
}

/** As versões anteriores, da mais recente para a mais antiga; cada uma é um bloco com o cabeçalho e os arquivos. */
export function ListaDeVersoes({ versoes, todas, ...resto }: ListaDeVersoesProps) {
  return (
    <ol className="lista-de-versoes">
      {versoes.map((versao) => <li key={versao.id}><BlocoDaVersao versao={versao} versoes={todas} {...resto} /></li>)}
    </ol>
  )
}

type BlocoDaVersaoProps = Omit<ListaDeVersoesProps, 'versoes' | 'todas'> & { versao: Versao; versoes: Versao[] }

function BlocoDaVersao({ modulo, processoId, versao, versoes, podeAlterar, aoAlterada, situacoes }: BlocoDaVersaoProps) {
  const rotulo = rotuloDaVersao(versao)
  const rotuloDaOrigem = rotuloDaAnterior(versao, versoes)
  return (
    <article className="bloco-da-versao" aria-label={rotulo}>
      <p className="bloco-da-versao-cabecalho">
        <strong>{rotulo}</strong>
        <time dateTime={versao.enviadaEm}>{formatarMomento(versao.enviadaEm)}</time>
        <span>{versao.autor ?? '—'}</span>
        {versao.etapa && <span>{versao.etapa}</span>}
        {versao.historica && <Pilula situacao="neutra">Histórica · somente leitura</Pilula>}
        {versao.aprovada && <Pilula situacao="aprovado">Aprovada</Pilula>}
        {relatorioPendente(versao) && <Pilula situacao="vencendo">Relatório pendente</Pilula>}
      </p>
      {versao.observacao && <p className="bloco-da-versao-observacao">{versao.observacao}</p>}
      <ul className="bloco-da-versao-arquivos">
        {versao.arquivos.map((arquivo) => {
          const origem = origemDoRelatorio(arquivo, versoes)
          return (
            <li key={arquivo.id}>
              <LinkDoArquivo versoes={modulo} arquivo={arquivo} />
              <MarcaNoDrive situacao={situacoes?.[arquivo.id]} />
              {origem && <span className="bloco-da-versao-origem">{`Sem alteração de conteúdo · relatório da ${origem}`}</span>}
              {podeAlterar && !versao.historica && !versao.aprovada && (
                <AcaoSubstituir modulo={modulo} processoId={processoId} versao={versao} arquivo={arquivo} aoConcluir={aoAlterada} />
              )}
            </li>
          )
        })}
      </ul>
      {podeAlterar && rotuloDaOrigem && podeCopiarRelatorio(versao, versoes) && (
        <AcaoSemAlteracao modulo={modulo} processoId={processoId} versao={versao} rotuloDaOrigem={rotuloDaOrigem} aoConcluir={aoAlterada} />
      )}
    </article>
  )
}
