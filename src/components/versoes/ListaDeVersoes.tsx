import { formatarMomento } from '../../acesso/historico'
import { relatoriosDaVersao, textoDoRelatorio } from '../../versoes/relatorioQueVale'
import { emOrdemDeExibicao, papeisQueSePodeAcrescentar, rotuloDaVersao } from '../../versoes/rotulos'
import type { ArquivoDaVersao, ConferenciaDosArquivos, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { Pilula } from '../Pilula'
import { AcaoSubstituir } from './AcaoSubstituir'
import { AcaoEditarNumero } from './AcaoEditarNumero'
import { AcrescentarArquivo } from './AcrescentarArquivo'
import { LinkDoArquivo } from './LinkDoArquivo'
import { MarcaNoDrive } from './MarcaNoDrive'

type ListaDeVersoesProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versoes: Versao[]
  /** Todas as versões do processo: o relatório que vale numa versão pode ser o de uma anterior, que pode estar fora da lista. */
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

function PilulasDaVersao({ versao }: { versao: Versao }) {
  return (
    <>
      {versao.historica && <Pilula situacao="neutra">Histórica · somente leitura</Pilula>}
      {versao.piloto && <Pilula situacao="neutra">Piloto</Pilula>}
      {versao.aprovada && <Pilula situacao="aprovado">Aprovada</Pilula>}
    </>
  )
}

type ArquivoDoBlocoProps = BlocoDaVersaoProps & {
  arquivo: ArquivoDaVersao
  /** O texto do link do relatório ("Relatório V2 (da V7)"); sem ele, o link mostra o nome do arquivo. */
  rotulo?: string
  /** Falso no relatório que vale por vir de outra versão: ele se substitui lá, na versão dele. */
  daPropriaVersao: boolean
}

function ArquivoDoBloco({ modulo, processoId, versao, podeAlterar, aoAlterada, situacoes, arquivo, rotulo, daPropriaVersao }: ArquivoDoBlocoProps) {
  return (
    <li>
      <LinkDoArquivo versoes={modulo} arquivo={arquivo} rotulo={rotulo} />
      <MarcaNoDrive situacao={situacoes?.[arquivo.id]} />
      {podeAlterar && daPropriaVersao && !versao.historica && !versao.aprovada && (
        <AcaoSubstituir modulo={modulo} processoId={processoId} versao={versao} arquivo={arquivo} aoConcluir={aoAlterada} />
      )}
    </li>
  )
}

function BlocoDaVersao(props: BlocoDaVersaoProps) {
  const { modulo, processoId, versao, versoes, podeAlterar, aoAlterada } = props
  const rotulo = rotuloDaVersao(versao)
  const fluxogramas = emOrdemDeExibicao(versao.arquivos.filter(({ papel }) => papel !== 'relatorio'))
  const doFluxo = (arquivo: ArquivoDaVersao) => <ArquivoDoBloco key={arquivo.id} {...props} arquivo={arquivo} daPropriaVersao />
  return (
    <article className="bloco-da-versao" aria-label={rotulo}>
      <div className="bloco-da-versao-cabecalho">
        <strong>{rotulo}</strong>
        {podeAlterar && <AcaoEditarNumero modulo={modulo} versao={versao} aoGravar={aoAlterada} />}
        <time dateTime={versao.enviadaEm}>{formatarMomento(versao.enviadaEm)}</time>
        <span>{versao.autor ?? '—'}</span>
        {versao.etapa && <span>{versao.etapa}</span>}
        <PilulasDaVersao versao={versao} />
      </div>
      <ul className="bloco-da-versao-arquivos">
        {fluxogramas.filter(({ papel }) => papel !== 'bpmn').map(doFluxo)}
        {relatoriosDaVersao(versao, versoes).map((relatorio) => (
          <ArquivoDoBloco key={relatorio.arquivo.id} {...props} arquivo={relatorio.arquivo} rotulo={textoDoRelatorio(relatorio)}
            daPropriaVersao={relatorio.daVersao === null} />
        ))}
        {fluxogramas.filter(({ papel }) => papel === 'bpmn').map(doFluxo)}
        {podeAlterar && papeisQueSePodeAcrescentar(versao).map((papel) => (
          <AcrescentarArquivo key={papel} modulo={modulo} processoId={processoId} versao={versao} papel={papel} aoConcluir={aoAlterada} />
        ))}
      </ul>
    </article>
  )
}
