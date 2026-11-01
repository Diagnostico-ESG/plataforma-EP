import type { AgruparListaPor, LinhasDoQuadro, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'

const OPCOES_DA_SITUACAO: { valor: MostrarNoPortfolio; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' }, { valor: 'em_andamento', rotulo: 'Em andamento' }, { valor: 'suspensos', rotulo: 'Suspensos' },
  { valor: 'concluidos', rotulo: 'Concluídos' }, { valor: 'cancelados', rotulo: 'Cancelados' },
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

type SituacaoDaVisaoProps = { mostrar: MostrarNoPortfolio; aoMudar: (mostrar: MostrarNoPortfolio) => void }

/** "Situação: Todos | Em andamento | Suspensos | Concluídos | Cancelados", na Lista e no Quadro por setor (o portfólio). */
export function SituacaoDaVisao({ mostrar, aoMudar }: SituacaoDaVisaoProps) {
  return <ControleDeOpcoes rotulo="Situação" opcoes={OPCOES_DA_SITUACAO} escolhida={mostrar} aoMudar={aoMudar} />
}

const OPCOES_DAS_LINHAS: { valor: LinhasDoQuadro; rotulo: string }[] = [
  { valor: 'nenhuma', rotulo: 'Nenhuma' }, { valor: 'setor', rotulo: 'Setor' }, { valor: 'responsavel', rotulo: 'Responsável' },
]

type LinhasDoQuadroControleProps = { linhas: LinhasDoQuadro; aoMudar: (linhas: LinhasDoQuadro) => void }

/** "Linhas: Nenhuma | Setor | Responsável", só no Quadro por etapa: separa os cartões em faixas sem perder as colunas. */
export function LinhasDoQuadroControle({ linhas, aoMudar }: LinhasDoQuadroControleProps) {
  return <ControleDeOpcoes rotulo="Linhas" opcoes={OPCOES_DAS_LINHAS} escolhida={linhas} aoMudar={aoMudar} />
}

type DestacarOsMeusProps = { ligado: boolean; aoAlternar: () => void }

/** "Destacar os meus" esmaece os cartões dos outros; é independente do filtro Responsável (ADR 0037). */
export function DestacarOsMeus({ ligado, aoAlternar }: DestacarOsMeusProps) {
  return (
    <button type="button" className={ligado ? 'botao botao-ligado' : 'botao botao-secundario'} aria-pressed={ligado}
      onClick={aoAlternar}>
      Destacar os meus
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
