type CaixaMostrarInativosProps = { marcada: boolean; aoMudar: (marcada: boolean) => void }

export function CaixaMostrarInativos({ marcada, aoMudar }: CaixaMostrarInativosProps) {
  return (
    <label className="cadastros-inativos">
      <input type="checkbox" checked={marcada} onChange={(evento) => aoMudar(evento.target.checked)} />
      Mostrar inativos
    </label>
  )
}

export function LinhaFantasma({ colunas }: { colunas: number }) {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      {Array.from({ length: colunas }, (_, i) => <td key={i}><span className="fantasma-barra" /></td>)}
    </tr>
  )
}
