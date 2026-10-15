import type { EtapaNoCatalogo, NivelDaEtapa } from '../../processos/tipos'

type CamposDaEtapaNovaProps = {
  id: string
  etapas: EtapaNoCatalogo[]
  codigo: string
  nivel: NivelDaEtapa
  posicao: string
  aoMudarCodigo: (codigo: string) => void
  aoMudarNivel: (nivel: NivelDaEtapa) => void
  aoMudarPosicao: (posicao: string) => void
}

/** Código, nível e posição: só se escolhem ao criar; depois de criada a etapa mantém os dois primeiros. */
export function CamposDaEtapaNova(props: CamposDaEtapaNovaProps) {
  const { id, etapas, codigo, nivel, posicao } = props
  return (
    <>
      <label htmlFor={`${id}-codigo`}>Código</label>
      <input id={`${id}-codigo`} value={codigo} maxLength={40} autoComplete="off" onChange={(e) => props.aoMudarCodigo(e.target.value)} />
      <label htmlFor={`${id}-nivel`}>Nível</label>
      <select id={`${id}-nivel`} value={nivel} onChange={(e) => props.aoMudarNivel(e.target.value as NivelDaEtapa)}>
        <option value="setor">Setor</option>
        <option value="processo">Processo</option>
      </select>
      <label htmlFor={`${id}-posicao`}>Posição</label>
      <select id={`${id}-posicao`} value={posicao} onChange={(e) => props.aoMudarPosicao(e.target.value)}>
        <option value="">No fim</option>
        {etapas.map((etapa) => <option key={etapa.id} value={etapa.id}>Antes de {etapa.nome}</option>)}
      </select>
    </>
  )
}
