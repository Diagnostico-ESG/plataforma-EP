import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'

const OPCOES: { valor: AgruparQuadroPor; rotulo: string }[] = [
  { valor: 'etapa', rotulo: 'Etapa' }, { valor: 'responsavel', rotulo: 'Responsável' },
]

type AgruparPorProps = { agrupar: AgruparQuadroPor; aoMudar: (agrupar: AgruparQuadroPor) => void }

/** "Agrupar por: Etapa | Responsável": dois botões, o escolhido anunciado por aria-pressed. */
export function AgruparPor({ agrupar, aoMudar }: AgruparPorProps) {
  return (
    <div className="controle-do-quadro" role="group" aria-label="Agrupar por">
      <span className="filtro-rotulo" aria-hidden="true">Agrupar por</span>
      <span className="controle-opcoes">
        {OPCOES.map(({ valor, rotulo }) => (
          <button key={valor} type="button" className={agrupar === valor ? 'botao botao-principal' : 'botao botao-secundario'}
            aria-pressed={agrupar === valor} onClick={() => aoMudar(valor)}>
            {rotulo}
          </button>
        ))}
      </span>
    </div>
  )
}
