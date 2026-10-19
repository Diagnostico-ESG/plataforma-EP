import './VersaoEmDestaque.css'
import { formatarMomento } from '../../acesso/historico'
import {
  PAPEIS, formatarDiaEMes, origemDoRelatorio, podeCopiarRelatorio, relatorioPendente, rotuloCurtoDoArquivo, rotuloDaAnterior,
  rotuloDaVersao,
} from '../../versoes/rotulos'
import type { ArquivoDaVersao, ConferenciaDosArquivos, ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { Pilula } from '../Pilula'
import { AcaoSemAlteracao } from './AcaoSemAlteracao'
import { AcaoSubstituir } from './AcaoSubstituir'
import { LinkDoArquivo } from './LinkDoArquivo'
import { MarcaNoDrive } from './MarcaNoDrive'

export type VersaoEmDestaqueProps = {
  modulo: ModuloDeVersoes
  processoId: string
  versao: Versao
  /** Todas as versões do processo: a anterior e a origem do relatório copiado. */
  versoes: Versao[]
  /** Administrador ou Integrante, com o processo em andamento (quem recusa é a função do servidor e o banco). */
  podeAlterar: boolean
  situacoes?: ConferenciaDosArquivos
  aoAlterada: () => void
  aoAcrescentarRelatorio: () => void
}

/** A versão mais recente numa linha ("V2 · 02/10 · falta relatório"), com um botão por arquivo e o que falta no lugar dele. */
export function VersaoEmDestaque(props: VersaoEmDestaqueProps) {
  const { modulo, processoId, versao, versoes, podeAlterar, aoAlterada } = props
  const rotuloDaOrigem = rotuloDaAnterior(versao, versoes)
  return (
    <article className="versao-destaque" aria-label={rotuloDaVersao(versao)}>
      <LinhaDoDestaque versao={versao} />
      <AutoriaDoDestaque versao={versao} />
      <ArquivosDoDestaque {...props} />
      {podeAlterar && rotuloDaOrigem && podeCopiarRelatorio(versao, versoes) && (
        <AcaoSemAlteracao modulo={modulo} processoId={processoId} versao={versao} rotuloDaOrigem={rotuloDaOrigem} aoConcluir={aoAlterada} />
      )}
    </article>
  )
}

function LinhaDoDestaque({ versao }: { versao: Versao }) {
  return (
    <p className="versao-destaque-linha">
      <strong className="versao-destaque-numero">{rotuloDaVersao(versao)}</strong>
      <span className="versao-destaque-ponto" aria-hidden="true">·</span>
      <time dateTime={versao.enviadaEm} title={formatarMomento(versao.enviadaEm)}>{formatarDiaEMes(versao.enviadaEm)}</time>
      {versao.historica && <Pilula situacao="neutra">Histórica · somente leitura</Pilula>}
      {relatorioPendente(versao) && <Pilula situacao="vencendo">falta relatório</Pilula>}
    </p>
  )
}

function AutoriaDoDestaque({ versao }: { versao: Versao }) {
  // O ponto entre autor e etapa vem do CSS: cada um continua um texto próprio.
  const autoria = [versao.autor, versao.etapa].filter((parte): parte is string => Boolean(parte))
  return (
    <>
      {autoria.length > 0 && <p className="versao-destaque-autoria">{autoria.map((parte) => <span key={parte}>{parte}</span>)}</p>}
      {versao.observacao && <p className="versao-destaque-observacao">{versao.observacao}</p>}
    </>
  )
}

/** Na ordem do formulário (fluxograma, imagem, Bizagi, relatório): o relatório que falta fica no lugar dele, por último. */
function emOrdem(arquivos: ArquivoDaVersao[]): ArquivoDaVersao[] {
  return [...arquivos].sort((a, b) => PAPEIS.indexOf(a.papel) - PAPEIS.indexOf(b.papel))
}

function ArquivosDoDestaque({ modulo, processoId, versao, versoes, podeAlterar, situacoes, aoAlterada, aoAcrescentarRelatorio }: VersaoEmDestaqueProps) {
  return (
    <ul className="arquivos-do-destaque">
      {emOrdem(versao.arquivos).map((arquivo) => {
        const origem = origemDoRelatorio(arquivo, versoes)
        return (
          <li key={arquivo.id} className={`arquivo-do-destaque arquivo-${arquivo.papel === 'relatorio' ? 'relatorio' : 'fluxograma'}`}>
            <LinkDoArquivo versoes={modulo} arquivo={arquivo} rotulo={rotuloCurtoDoArquivo(arquivo)} />
            <MarcaNoDrive situacao={situacoes?.[arquivo.id]} />
            {origem && <span className="arquivo-origem">{`Sem alteração de conteúdo · relatório da ${origem}`}</span>}
            {podeAlterar && !versao.historica && (
              <AcaoSubstituir modulo={modulo} processoId={processoId} versao={versao} arquivo={arquivo} aoConcluir={aoAlterada} />
            )}
          </li>
        )
      })}
      {podeAlterar && relatorioPendente(versao) && (
        <li className="arquivo-do-destaque">
          <button type="button" className="arquivo-que-falta" onClick={aoAcrescentarRelatorio}>
            <span aria-hidden="true">+ </span>Acrescentar relatório
          </button>
        </li>
      )}
    </ul>
  )
}
