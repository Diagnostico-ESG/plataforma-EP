import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { formatarData } from '../../lib/datas'
import { CODIGO_DA_APROVACAO, CODIGO_DA_REVISAO_INTERNA, CODIGO_DA_VALIDACAO } from '../../processos/codigosDasEtapas'
import type { EtapaDoVerso, ProcessoLido, UltimaVersao } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { textoDaValidacao } from '../../revisoes/textoDaValidacao'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { AprovacaoDaEtapa } from './AprovacaoDaEtapa'
import { RevisoesDaEtapa } from './RevisoesDaEtapa'

export type DadosDasEtapas = {
  /** O módulo de revisões e os registros lidos pelo verso: a gaveta da Revisão interna lista as revisões e a da Aprovação mostra a atual. */
  revisoes: ModuloDeRevisoes
  /** O módulo de versões: a gaveta da Aprovação envia, troca e baixa o .pdf protocolado por ele. */
  versoes: ModuloDeVersoes
  registros: RegistrosDoProcesso
  /** A versão mais recente e a da passagem, para a janela de editar a revisão. */
  ultimaVersao: UltimaVersao | null
  /** Quem pode alterar, com o processo em andamento ou concluído; suspenso, cancelado e Consulta só leem. */
  podeEditar: boolean
}

type DetalheDaEtapaProps = DadosDasEtapas & { id: string; etapa: EtapaDoVerso; processo: ProcessoLido }

/**
 * A gaveta de uma etapa: as entradas e saídas do processo nela, da mais recente para a mais antiga, e, na Revisão interna, na
 * Validação com o setor e na Aprovação pelo setor, os registros. Só leitura: mover, etiqueta e responsável são do Agora.
 */
export function DetalheDaEtapa(props: DetalheDaEtapaProps) {
  const { id, etapa } = props
  return (
    <div id={id} className="etapa-gaveta">
      <Passagens etapa={etapa} />
      <RegistrosDaEtapa {...props} />
    </div>
  )
}

function Passagens({ etapa }: { etapa: EtapaDoVerso }) {
  if (etapa.passagens.length === 0) return <p className="etapa-datas">Ainda não passou por esta etapa</p>
  return (
    <ul className="etapa-passagens">
      {etapa.passagens.map((passagem) => (
        <li key={passagem.entrouEm + (passagem.saiuEm ?? 'aberta')} className="etapa-datas">
          Entrou em {formatarData(passagem.entrouEm)} · {passagem.saiuEm ? `saiu em ${formatarData(passagem.saiuEm)}` : 'ainda nesta etapa'}
        </li>
      ))}
    </ul>
  )
}

// Os registros que a gaveta mostra: as revisões na Revisão interna, a data da validação na Validação com o setor e a aprovação
// (com o .pdf) na Aprovação pelo setor.
function RegistrosDaEtapa({ etapa, ...props }: DetalheDaEtapaProps) {
  if (etapa.codigo === CODIGO_DA_VALIDACAO) return <p className="etapa-registros-aviso">{textoDaValidacao(props.processo.dataDaValidacao)}</p>
  if (etapa.codigo === CODIGO_DA_REVISAO_INTERNA) {
    return <RevisoesDaEtapa revisoes={props.revisoes} registros={props.registros} ultimaVersao={props.ultimaVersao} podeEditar={props.podeEditar} />
  }
  if (etapa.codigo === CODIGO_DA_APROVACAO) {
    return (
      <AprovacaoDaEtapa estado={props.registros.aprovacao} aoTentarDeNovo={props.registros.tentarDeNovo} revisoes={props.revisoes}
        versoes={props.versoes} processo={props.processo} podeEditar={props.podeEditar} aoAtualizar={props.registros.atualizar} />
    )
  }
  return null
}
