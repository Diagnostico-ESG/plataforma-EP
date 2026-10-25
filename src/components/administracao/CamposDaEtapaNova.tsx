import { ehEtapaFixa } from '../../processos/codigosDasEtapas'
import type { EtapaNoCatalogo } from '../../processos/tipos'

type CamposDaEtapaNovaProps = {
  id: string
  etapas: EtapaNoCatalogo[]
  codigo: string
  posicao: string
  aoMudarCodigo: (codigo: string) => void
  aoMudarPosicao: (posicao: string) => void
}

/** Código e posição: só se escolhem ao criar; depois de criada a etapa mantém o código. A etapa nova fica entre as fixas. */
export function CamposDaEtapaNova(props: CamposDaEtapaNovaProps) {
  const { id, etapas, codigo, posicao } = props
  return (
    <>
      <label htmlFor={`${id}-codigo`}>Código</label>
      <input id={`${id}-codigo`} value={codigo} maxLength={40} autoComplete="off" onChange={(e) => props.aoMudarCodigo(e.target.value)} />
      <label htmlFor={`${id}-posicao`}>Posição</label>
      <select id={`${id}-posicao`} value={posicao} onChange={(e) => props.aoMudarPosicao(e.target.value)}>
        <option value="">No fim, antes de Concluídos</option>
        {etapas.filter((etapa) => !ehEtapaFixa(etapa.codigo)).map((etapa) => <option key={etapa.id} value={etapa.id}>Antes de {etapa.nome}</option>)}
      </select>
    </>
  )
}
