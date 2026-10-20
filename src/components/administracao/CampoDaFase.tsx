import { FASES_DO_REGIMENTO } from '../../processos/fasesDoRegimento'

type CampoDaFaseProps = { id: string; fase: string; aoMudar: (fase: string) => void }

/** A fase do Regimento (IV a IX) da etapa; sem valor escolhido ao criar, para a pessoa decidir (história 1 da spec). */
export function CampoDaFase({ id, fase, aoMudar }: CampoDaFaseProps) {
  return (
    <>
      <label htmlFor={`${id}-fase`}>Fase do Regimento</label>
      <select id={`${id}-fase`} value={fase} onChange={(e) => aoMudar(e.target.value)}>
        <option value="">Escolha a fase</option>
        {FASES_DO_REGIMENTO.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
      </select>
    </>
  )
}
