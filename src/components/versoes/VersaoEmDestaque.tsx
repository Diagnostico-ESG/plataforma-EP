import './VersaoEmDestaque.css'
import { formatarMomento } from '../../acesso/historico'
import { relatoriosDaVersao, textoDoRelatorio } from '../../versoes/relatorioQueVale'
import { emOrdemDeExibicao, formatarDiaEMes, papeisQueSePodeAcrescentar, rotuloCurtoDoArquivo, rotuloDaVersao } from '../../versoes/rotulos'
import type { ArquivoDaVersao, ConferenciaDosArquivos, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { Pilula } from '../Pilula'
import { AcaoSubstituir } from './AcaoSubstituir'
import { AcaoEditarNumero } from './AcaoEditarNumero'
import { AcrescentarArquivo } from './AcrescentarArquivo'
import { LinkDoArquivo } from './LinkDoArquivo'
import { MarcaNoDrive } from './MarcaNoDrive'

export type VersaoEmDestaqueProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  /** Todas as versões do processo: o relatório que vale numa versão pode ser o de uma anterior. */
  versoes: Versao[]
  /** Administrador ou Integrante, com o processo em andamento (quem recusa é a função do servidor e o banco). */
  podeAlterar: boolean
  situacoes?: ConferenciaDosArquivos
  aoAlterada: () => void
}

/** A versão mais recente numa linha ("V2 · 02/10"), com um botão por arquivo e o que falta no lugar dele. */
export function VersaoEmDestaque(props: VersaoEmDestaqueProps) {
  const { versao } = props
  return (
    <article className="versao-destaque" aria-label={rotuloDaVersao(versao)}>
      <LinhaDoDestaque versao={versao} versoes={props.versoes} modulo={props.modulo} podeAlterar={props.podeAlterar} aoGravar={props.aoAlterada} />
      <AutoriaDoDestaque versao={versao} />
      <ArquivosDoDestaque {...props} />
    </article>
  )
}

type LinhaDoDestaqueProps = { versao: Versao; versoes: Versao[]; modulo: ModuloDeVersoes; podeAlterar: boolean; aoGravar: () => void }

function LinhaDoDestaque({ versao, versoes, modulo, podeAlterar, aoGravar }: LinhaDoDestaqueProps) {
  return (
    <div className="versao-destaque-linha">
      <strong className="versao-destaque-numero">{rotuloDaVersao(versao)}</strong>
      {podeAlterar && <AcaoEditarNumero modulo={modulo} versao={versao} versoes={versoes} aoGravar={aoGravar} />}
      <span className="versao-destaque-ponto" aria-hidden="true">·</span>
      <time dateTime={versao.enviadaEm} title={formatarMomento(versao.enviadaEm)}>{formatarDiaEMes(versao.enviadaEm)}</time>
      {versao.historica && <Pilula situacao="neutra">Histórica · somente leitura</Pilula>}
      {versao.piloto && <Pilula situacao="neutra">Piloto</Pilula>}
      {versao.aprovada && <Pilula situacao="aprovado">Aprovada</Pilula>}
    </div>
  )
}

function AutoriaDoDestaque({ versao }: { versao: Versao }) {
  // O ponto entre autor e etapa vem do CSS: cada um continua um texto próprio.
  const autoria = [versao.autor, versao.etapa].filter((parte): parte is string => Boolean(parte))
  return (
    <>
      {autoria.length > 0 && <p className="versao-destaque-autoria">{autoria.map((parte) => <span key={parte}>{parte}</span>)}</p>}
    </>
  )
}

type ArquivoDoDestaqueProps = VersaoEmDestaqueProps & {
  arquivo: ArquivoDaVersao
  /** O texto do botão ("Fluxograma .bpm", "Relatório V2 (da V7)"). */
  rotulo: string
  /** Falso no relatório que vale por vir de outra versão: ele se substitui lá, na versão dele. */
  daPropriaVersao: boolean
}

function ArquivoDoDestaque({ modulo, processoId, versao, podeAlterar, situacoes, aoAlterada, arquivo, rotulo, daPropriaVersao }: ArquivoDoDestaqueProps) {
  return (
    <li className={`arquivo-do-destaque arquivo-${arquivo.papel === 'relatorio' ? 'relatorio' : 'fluxograma'}`}>
      <LinkDoArquivo versoes={modulo} arquivo={arquivo} rotulo={rotulo} />
      <MarcaNoDrive situacao={situacoes?.[arquivo.id]} />
      {podeAlterar && daPropriaVersao && !versao.historica && !versao.aprovada && (
        <AcaoSubstituir modulo={modulo} processoId={processoId} versao={versao} arquivo={arquivo} aoConcluir={aoAlterada} />
      )}
    </li>
  )
}

/**
 * Na ordem .png, .bpm, relatório e .bpmn: o relatório que vale (o da versão, ou o último anterior) fica no lugar dele,
 * antes do .bpmn opcional; o .png e o .bpmn que a versão ainda não tem ficam no fim, no espaço tracejado de acrescentar.
 */
function ArquivosDoDestaque(props: VersaoEmDestaqueProps) {
  const { modulo, processoId, versao, versoes, podeAlterar, aoAlterada } = props
  const fluxogramas = emOrdemDeExibicao(versao.arquivos.filter(({ papel }) => papel !== 'relatorio'))
  const doFluxo = (arquivo: ArquivoDaVersao) => (
    <ArquivoDoDestaque key={arquivo.id} {...props} arquivo={arquivo} rotulo={rotuloCurtoDoArquivo(arquivo)} daPropriaVersao />
  )
  return (
    <ul className="arquivos-do-destaque">
      {fluxogramas.filter(({ papel }) => papel !== 'bpmn').map(doFluxo)}
      {relatoriosDaVersao(versao, versoes).map((relatorio) => (
        <ArquivoDoDestaque key={relatorio.arquivo.id} {...props} arquivo={relatorio.arquivo} rotulo={textoDoRelatorio(relatorio)}
          daPropriaVersao={relatorio.daVersao === null} />
      ))}
      {fluxogramas.filter(({ papel }) => papel === 'bpmn').map(doFluxo)}
      {podeAlterar && papeisQueSePodeAcrescentar(versao).map((papel) => (
        <AcrescentarArquivo key={papel} modulo={modulo} processoId={processoId} versao={versao} papel={papel} aoConcluir={aoAlterada} />
      ))}
    </ul>
  )
}
