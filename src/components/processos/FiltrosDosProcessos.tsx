import { useId } from 'react'
import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'
import { BuscaDaLista } from './BuscaDaLista'
import type { FiltrosDosProcessos as Filtros, MostrarNoPortfolio, VisaoDosProcessos } from '../../processos/enderecoDosProcessos'
import { SEM_FILTROS } from '../../processos/enderecoDosProcessos'
import { temFiltro, type OpcaoDoFiltro, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'

type FiltrosDosProcessosProps = {
  visao: VisaoDosProcessos
  opcoes: OpcoesDosFiltros
  filtros: Filtros
  /** Com "Concluídos" na Lista, a Situação não tem o que filtrar e some. */
  mostrar: MostrarNoPortfolio
  aoMudar: (filtros: Filtros) => void
}

/** Os filtros do Quadro e da Lista; a situação só na Lista (e fora de "Concluídos"), porque o Quadro mostra apenas os vivos. */
export function FiltrosDosProcessos({ visao, opcoes, filtros, mostrar, aoMudar }: FiltrosDosProcessosProps) {
  // Os valores vêm das próprias opções, então o tipo e a situação escolhidos são sempre válidos.
  const mudar = (nome: keyof Filtros) => (valor: string) => aoMudar({ ...filtros, [nome]: valor || null } as Filtros)
  return (
    <div className="filtros-dos-processos" role="group" aria-label="Filtros dos processos">
      {visao === 'lista' && <BuscaDaLista valor={filtros.busca} aoMudar={mudar('busca')} />}
      <SeletorDoFiltro rotulo="Setor" todos="Todos" opcoes={opcoes.setores} valor={filtros.setor} aoMudar={mudar('setor')} />
      <SeletorDoFiltro rotulo="Macroprocesso" todos="Todos" opcoes={opcoes.macroprocessos} valor={filtros.macroprocesso}
        aoMudar={mudar('macroprocesso')} />
      <SeletorDoFiltro rotulo="Etapa atual" todos="Todas" opcoes={opcoes.etapas} valor={filtros.etapa} aoMudar={mudar('etapa')} />
      <SeletorDoFiltro rotulo="Tipo" todos="Todos" opcoes={opcoes.tipos} valor={filtros.tipo} aoMudar={mudar('tipo')} />
      <SeletorDoFiltro rotulo="Responsável" todos="Todos" opcoes={opcoes.responsaveis} valor={filtros.responsavel}
        aoMudar={mudar('responsavel')} />
      {visao === 'lista' && mostrar === 'todos' && (
        <SeletorDoFiltro rotulo="Situação" todos="Todas" opcoes={opcoes.situacoes} valor={filtros.situacao}
          aoMudar={mudar('situacao')} />
      )}
      {temFiltro(filtros) && <BotaoLimparFiltros aoLimpar={() => aoMudar(SEM_FILTROS)} />}
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

function BotaoLimparFiltros({ aoLimpar }: { aoLimpar: () => void }) {
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

export function NenhumProcessoDoUsuario({ aoVerTodos }: { aoVerTodos: () => void }) {
  return (
    <div className="filtros-sem-resultado">
      <p className="cadastros-vazio">Nenhum processo com você agora.</p>
      <button type="button" className="botao botao-secundario" onClick={aoVerTodos}>Ver todos</button>
    </div>
  )
}
