import type { AgruparQuadroPor, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'

const OPCOES: { valor: AgruparQuadroPor; rotulo: string }[] = [
  { valor: 'etapa', rotulo: 'Etapa' }, { valor: 'responsavel', rotulo: 'Responsável' }, { valor: 'setor', rotulo: 'Setor' },
]

const OPCOES_DO_PORTFOLIO: { valor: MostrarNoPortfolio; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' }, { valor: 'concluidos', rotulo: 'Concluídos' },
]

type ControleDeOpcoesProps<T extends string> = {
  rotulo: string; opcoes: { valor: T; rotulo: string }[]; escolhida: T; aoMudar: (valor: T) => void
}

// Um rótulo e um botão por opção, a escolhida em destaque e anunciada por aria-pressed.
function ControleDeOpcoes<T extends string>({ rotulo, opcoes, escolhida, aoMudar }: ControleDeOpcoesProps<T>) {
  return (
    <div className="controle-do-quadro" role="group" aria-label={rotulo}>
      <span className="filtro-rotulo" aria-hidden="true">{rotulo}</span>
      <span className="controle-opcoes">
        {opcoes.map((opcao) => (
          <button key={opcao.valor} type="button" className={escolhida === opcao.valor ? 'botao botao-principal' : 'botao botao-secundario'}
            aria-pressed={escolhida === opcao.valor} onClick={() => aoMudar(opcao.valor)}>
            {opcao.rotulo}
          </button>
        ))}
      </span>
    </div>
  )
}

type AgruparPorProps = { agrupar: AgruparQuadroPor; aoMudar: (agrupar: AgruparQuadroPor) => void }

/** "Agrupar por: Etapa | Responsável | Setor". */
export function AgruparPor({ agrupar, aoMudar }: AgruparPorProps) {
  return <ControleDeOpcoes rotulo="Agrupar por" opcoes={OPCOES} escolhida={agrupar} aoMudar={aoMudar} />
}

type TodosOuConcluidosProps = { mostrar: MostrarNoPortfolio; aoMudar: (mostrar: MostrarNoPortfolio) => void }

/** "Mostrar: Todos | Concluídos", na Lista e no Quadro por setor (o portfólio). */
export function TodosOuConcluidos({ mostrar, aoMudar }: TodosOuConcluidosProps) {
  return <ControleDeOpcoes rotulo="Mostrar" opcoes={OPCOES_DO_PORTFOLIO} escolhida={mostrar} aoMudar={aoMudar} />
}

type SoOsMeusProps = { ligado: boolean; aoAlternar: () => void }

/** "Só os meus" é o filtro Responsável com o id de quem está na tela; o botão só lê e escreve esse filtro. */
export function SoOsMeus({ ligado, aoAlternar }: SoOsMeusProps) {
  return (
    <button type="button" className={ligado ? 'botao botao-principal' : 'botao botao-secundario'} aria-pressed={ligado}
      onClick={aoAlternar}>
      Só os meus
    </button>
  )
}
