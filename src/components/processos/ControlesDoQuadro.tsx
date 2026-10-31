import type { AgruparListaPor, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'

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
          <button key={opcao.valor} type="button" className="botao"
            aria-pressed={escolhida === opcao.valor} onClick={() => aoMudar(opcao.valor)}>
            {opcao.rotulo}
          </button>
        ))}
      </span>
    </div>
  )
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
    <button type="button" className={ligado ? 'botao botao-ligado' : 'botao botao-secundario'} aria-pressed={ligado}
      onClick={aoAlternar}>
      Só os meus
    </button>
  )
}

const OPCOES_DA_LISTA: { valor: AgruparListaPor; rotulo: string }[] = [
  { valor: 'nenhum', rotulo: 'Nenhum' }, { valor: 'macroprocesso', rotulo: 'Macroprocesso' }, { valor: 'setor', rotulo: 'Setor' },
]

type AgruparAListaPorProps = { agrupar: AgruparListaPor; aoMudar: (agrupar: AgruparListaPor) => void }

/** "Agrupar por: Nenhum | Macroprocesso | Setor", só na Lista: a tabela comum ou a árvore. */
export function AgruparAListaPor({ agrupar, aoMudar }: AgruparAListaPorProps) {
  return <ControleDeOpcoes rotulo="Agrupar por" opcoes={OPCOES_DA_LISTA} escolhida={agrupar} aoMudar={aoMudar} />
}
