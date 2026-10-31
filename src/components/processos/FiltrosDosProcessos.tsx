import { useId } from 'react'
import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'
import type { FiltrosDosProcessos as Filtros, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'
import { SEM_FILTROS } from '../../processos/enderecoDosProcessos'
import { temFiltro, type OpcaoDoFiltro, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'

type FiltrosDosProcessosProps = {
  opcoes: OpcoesDosFiltros
  filtros: Filtros
  aoMudar: (filtros: Filtros) => void
  /** O [Limpar filtros]; o padrão só zera os filtros (o painel dos Filtros também devolve o foco). */
  aoLimpar?: () => void
}

/** Os filtros do Quadro, sem situação (o Quadro mostra só os vivos); a Lista filtra pelo cabeçalho (CabecalhoDaLista). */
export function FiltrosDosProcessos({ opcoes, filtros, aoMudar, aoLimpar = () => aoMudar(SEM_FILTROS) }: FiltrosDosProcessosProps) {
  // Os valores vêm das próprias opções, então o tipo escolhido é sempre válido.
  const mudar = (nome: keyof Filtros) => (valor: string) => aoMudar({ ...filtros, [nome]: valor || null } as Filtros)
  return (
    <div className="filtros-dos-processos" role="group" aria-label="Filtros dos processos">
      <SeletorDoFiltro rotulo="Setor" todos="Todos" opcoes={opcoes.setores} valor={filtros.setor} aoMudar={mudar('setor')} />
      <SeletorDoFiltro rotulo="Macroprocesso" todos="Todos" opcoes={opcoes.macroprocessos} valor={filtros.macroprocesso}
        aoMudar={mudar('macroprocesso')} />
      <SeletorDoFiltro rotulo="Etapa atual" todos="Todas" opcoes={opcoes.etapas} valor={filtros.etapa} aoMudar={mudar('etapa')} />
      <SeletorDoFiltro rotulo="Tipo" todos="Todos" opcoes={opcoes.tipos} valor={filtros.tipo} aoMudar={mudar('tipo')} />
      <SeletorDoFiltro rotulo="Responsável" todos="Todos" opcoes={opcoes.responsaveis} valor={filtros.responsavel}
        aoMudar={mudar('responsavel')} />
      {temFiltro(filtros) && <BotaoLimparFiltros aoLimpar={aoLimpar} />}
    </div>
  )
}

type SeletorDoFiltroProps = {
  rotulo: string
  todos: string
  opcoes: OpcaoDoFiltro[]
  valor: string | null
  aoMudar: (valor: string) => void
}

function SeletorDoFiltro({ rotulo, todos, opcoes, valor, aoMudar }: SeletorDoFiltroProps) {
  const id = useId()
  return (
    <div className="filtro">
      <label htmlFor={id} className="filtro-rotulo">{rotulo}</label>
      <select id={id} className="filtro-seletor" value={valor ?? ''} onChange={(evento) => aoMudar(evento.target.value)}>
        <BotaoDaCaixa />
        <option value="">{todos}</option>
        {opcoes.map((opcao) => <OpcaoDaCaixa key={opcao.valor} {...opcao} />)}
      </select>
    </div>
  )
}

export function BotaoLimparFiltros({ aoLimpar }: { aoLimpar: () => void }) {
  return <button type="button" className="botao botao-secundario filtros-limpar" onClick={aoLimpar}>Limpar filtros</button>
}

export function NenhumProcessoComFiltros({ aoLimpar }: { aoLimpar: () => void }) {
  return (
    <div className="filtros-sem-resultado">
      <p className="cadastros-vazio">Nenhum processo com estes filtros.</p>
      <BotaoLimparFiltros aoLimpar={aoLimpar} />
    </div>
  )
}

/** Acima do quadro (que continua na tela, esmaecido): o Destacar os meus ligado e nenhum processo da pessoa entre os que aparecem. */
export function AvisoSemProcessoSeu() {
  return <p className="aviso-do-destaque" role="status">Nenhum processo com você agora.</p>
}

const FRASE_DA_SITUACAO: Record<Exclude<MostrarNoPortfolio, 'todos'>, string> = {
  em_andamento: 'Nenhum processo em andamento.', suspensos: 'Nenhum processo suspenso.',
  concluidos: 'Nenhum processo concluído.', cancelados: 'Nenhum processo cancelado.',
}

/** A situação escolhida na Lista ou no Quadro por setor não tem processo: a frase dela, no lugar da dos filtros. */
export function NenhumProcessoNaSituacao({ mostrar, aoMostrarTodos }: { mostrar: Exclude<MostrarNoPortfolio, 'todos'>; aoMostrarTodos: () => void }) {
  return (
    <div className="filtros-sem-resultado">
      <p className="cadastros-vazio">{FRASE_DA_SITUACAO[mostrar]}</p>
      <button type="button" className="botao botao-secundario" onClick={aoMostrarTodos}>Mostrar todos</button>
    </div>
  )
}
