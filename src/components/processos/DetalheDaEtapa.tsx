import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { formatarData } from '../../lib/datas'
import { CODIGO_DA_APROVACAO, CODIGO_DA_REVISAO_INTERNA } from '../../processos/codigosDasEtapas'
import type { EtapaDoVerso, UltimaVersao } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { AprovacaoDaEtapa } from './AprovacaoDaEtapa'
import { RevisoesDaEtapa } from './RevisoesDaEtapa'

export type DadosDasEtapas = {
  /** O módulo de revisões e os registros lidos pelo verso: a gaveta da Revisão interna lista as revisões e a da Aprovação mostra a atual. */
  revisoes: ModuloDeRevisoes
  registros: RegistrosDoProcesso
  /** A versão mais recente e a da passagem, para a janela de editar a revisão. */
  ultimaVersao: UltimaVersao | null
  /** Quem pode alterar, com o processo em andamento ou concluído; suspenso, cancelado, arquivado e Consulta só leem. */
  podeEditar: boolean
}

type DetalheDaEtapaProps = DadosDasEtapas & { id: string; etapa: EtapaDoVerso }

/**
 * A gaveta de uma etapa: as entradas e saídas do processo nela, da mais recente para a mais antiga, e, na Revisão interna e
 * na Aprovação pelo setor, os registros. Só leitura: mover, etiqueta e responsável são do Agora.
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

// Os registros que a gaveta mostra: as revisões na Revisão interna e a aprovação na Aprovação pelo setor.
function RegistrosDaEtapa({ etapa, ...props }: DetalheDaEtapaProps) {
  if (etapa.codigo === CODIGO_DA_REVISAO_INTERNA) {
    return <RevisoesDaEtapa revisoes={props.revisoes} registros={props.registros} ultimaVersao={props.ultimaVersao} podeEditar={props.podeEditar} />
  }
  if (etapa.codigo === CODIGO_DA_APROVACAO) {
    return (
      <AprovacaoDaEtapa estado={props.registros.aprovacao} aoTentarDeNovo={props.registros.tentarDeNovo} revisoes={props.revisoes}
        podeEditar={props.podeEditar} aoAtualizar={props.registros.atualizar} />
    )
  }
  return null
}
