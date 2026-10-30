import { useId } from 'react'
import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'
import type { FiltrosDosProcessos as Filtros } from '../../processos/enderecoDosProcessos'
import { SEM_FILTROS } from '../../processos/enderecoDosProcessos'
import { temFiltro, type OpcaoDoFiltro, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'

type FiltrosDosProcessosProps = {
  opcoes: OpcoesDosFiltros
  filtros: Filtros
  aoMudar: (filtros: Filtros) => void
}

/** Os filtros do Quadro, sem situação (o Quadro mostra só os vivos); a Lista filtra pelo cabeçalho (CabecalhoDaLista). */
export function FiltrosDosProcessos({ opcoes, filtros, aoMudar }: FiltrosDosProcessosProps) {
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

export function NenhumProcessoDoUsuario({ aoVerTodos }: { aoVerTodos: () => void }) {
  return (
    <div className="filtros-sem-resultado">
      <p className="cadastros-vazio">Nenhum processo com você agora.</p>
      <button type="button" className="botao botao-secundario" onClick={aoVerTodos}>Ver todos</button>
    </div>
  )
}
