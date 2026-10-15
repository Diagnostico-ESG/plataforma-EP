import type { ModuloDeReunioes, Reuniao } from '../../reunioes/tipos'
import type { CamposDaReuniao } from '../../reunioes/validacaoDaReuniao'
import { EscolhaDeResponsaveis } from './EscolhaDeResponsaveis'
import { EscolhaDeUsuarios } from './EscolhaDeUsuarios'
import { OutrosParticipantes } from './OutrosParticipantes'

type ParticipantesDoFormularioProps = {
  campos: CamposDaReuniao
  reunioes: ModuloDeReunioes
  /** Na edição, a reunião que já existe: os marcados que saíram das listas continuam aparecendo. */
  reuniao?: Reuniao
  aoMudar: (mudanca: Partial<CamposDaReuniao>) => void
}

/** As três partes dos participantes: usuários do EP, responsáveis do setor escolhido e outros participantes. */
export function ParticipantesDoFormulario({ campos, reunioes, reuniao, aoMudar }: ParticipantesDoFormularioProps) {
  // Os responsáveis da reunião só valem enquanto o setor escolhido é o dela; trocado o setor, eles já saíram da marcação.
  const responsaveisDaReuniao = reuniao?.setorId === campos.setorId ? reuniao.responsaveis : []
  return (
    <>
      <EscolhaDeUsuarios reunioes={reunioes} daReuniao={reuniao?.usuarios ?? []} marcados={campos.usuariosIds}
        aoMudar={(usuariosIds) => aoMudar({ usuariosIds })} />
      {campos.setorId && (
        <EscolhaDeResponsaveis key={campos.setorId} reunioes={reunioes} setorId={campos.setorId}
          daReuniao={responsaveisDaReuniao} marcados={campos.responsaveisIds}
          aoMudar={(responsaveisIds) => aoMudar({ responsaveisIds })} />
      )}
      <OutrosParticipantes valor={campos.outrosParticipantes} aoMudar={(outrosParticipantes) => aoMudar({ outrosParticipantes })} />
    </>
  )
}
