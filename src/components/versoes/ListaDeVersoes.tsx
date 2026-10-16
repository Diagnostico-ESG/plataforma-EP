import { formatarMomento } from '../../acesso/historico'
import { origemDoRelatorio, podeCopiarRelatorio, relatorioPendente, rotuloDaAnterior, rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { AcaoSemAlteracao } from './AcaoSemAlteracao'
import { AcaoSubstituir } from './AcaoSubstituir'
import { LinkDoArquivo } from './LinkDoArquivo'

type ListaDeVersoesProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versoes: Versao[]
  /** Administrador ou Integrante, com o processo em andamento (quem recusa é a função do servidor e o banco). */
  podeAlterar: boolean
  aoAlterada: () => void
}

/** As versões, da mais recente para a mais antiga; cada uma é um bloco com o cabeçalho e os arquivos. */
export function ListaDeVersoes({ versoes, ...resto }: ListaDeVersoesProps) {
  if (versoes.length === 0) return <p className="cadastros-vazio">Nenhuma versão enviada.</p>
  return (
    <ol className="lista-de-versoes">
      {versoes.map((versao) => <BlocoDaVersao key={versao.id} versao={versao} versoes={versoes} {...resto} />)}
    </ol>
  )
}

type BlocoDaVersaoProps = Omit<ListaDeVersoesProps, 'versoes'> & { versao: Versao; versoes: Versao[] }

function BlocoDaVersao({ modulo, processoId, versao, versoes, podeAlterar, aoAlterada }: BlocoDaVersaoProps) {
  const rotulo = rotuloDaVersao(versao)
  const rotuloDaOrigem = rotuloDaAnterior(versao, versoes)
  return (
    <li className="bloco-da-versao" aria-label={rotulo}>
      <p className="bloco-da-versao-cabecalho">
        <strong>{rotulo}</strong>
        <time dateTime={versao.enviadaEm}>{formatarMomento(versao.enviadaEm)}</time>
        <span>{versao.autor ?? '—'}</span>
        {versao.etapa && <span>{versao.etapa}</span>}
        {versao.historica && <span className="bloco-da-versao-marca">Histórica · somente leitura</span>}
        {relatorioPendente(versao) && <span className="bloco-da-versao-marca">Relatório pendente</span>}
      </p>
      {versao.observacao && <p className="bloco-da-versao-observacao">{versao.observacao}</p>}
      <ul className="bloco-da-versao-arquivos">
        {versao.arquivos.map((arquivo) => {
          const origem = origemDoRelatorio(arquivo, versoes)
          return (
            <li key={arquivo.id}>
              <LinkDoArquivo versoes={modulo} arquivo={arquivo} />
              {origem && <span className="bloco-da-versao-origem">{`Sem alteração de conteúdo · relatório da ${origem}`}</span>}
              {podeAlterar && !versao.historica && (
                <AcaoSubstituir modulo={modulo} processoId={processoId} versao={versao} arquivo={arquivo} aoConcluir={aoAlterada} />
              )}
            </li>
          )
        })}
      </ul>
      {podeAlterar && rotuloDaOrigem && podeCopiarRelatorio(versao, versoes) && (
        <AcaoSemAlteracao modulo={modulo} processoId={processoId} versao={versao} rotuloDaOrigem={rotuloDaOrigem} aoConcluir={aoAlterada} />
      )}
    </li>
  )
}
