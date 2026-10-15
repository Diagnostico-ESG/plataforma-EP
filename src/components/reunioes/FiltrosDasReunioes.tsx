import { useId } from 'react'
import { type FiltrosDasReunioes as Filtros, SEM_FILTROS_DAS_REUNIOES } from '../../reunioes/enderecoDasReunioes'
import { temFiltro } from '../../reunioes/filtrosDasReunioes'
import { ROTULO_DO_TIPO_DE_REUNIAO } from '../../reunioes/rotulos'
import type { Reuniao, TipoDeReuniao } from '../../reunioes/tipos'

type FiltrosDasReunioesProps = { reunioes: Reuniao[]; filtros: Filtros; aoMudar: (filtros: Filtros) => void }

/** Os setores da escolha são os que têm reunião, por sigla. */
function setoresDasReunioes(reunioes: Reuniao[]): { id: string; sigla: string }[] {
  const porId = new Map(reunioes.map((reuniao) => [reuniao.setorId, { id: reuniao.setorId, sigla: reuniao.setorSigla }]))
  return [...porId.values()].sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR', { sensitivity: 'base' }))
}

export function FiltrosDasReunioes({ reunioes, filtros, aoMudar }: FiltrosDasReunioesProps) {
  const mudar = (mudanca: Partial<Filtros>) => aoMudar({ ...filtros, ...mudanca })
  return (
    <div className="filtros-dos-processos" role="group" aria-label="Filtros das reuniões">
      <SeletorDoFiltro rotulo="Setor" todos="Todos" valor={filtros.setor} aoMudar={(setor) => mudar({ setor })}
        opcoes={setoresDasReunioes(reunioes).map(({ id, sigla }) => ({ valor: id, rotulo: sigla }))} />
      <SeletorDoFiltro rotulo="Tipo" todos="Todos" valor={filtros.tipo}
        aoMudar={(tipo) => mudar({ tipo: tipo as TipoDeReuniao | null })}
        opcoes={Object.entries(ROTULO_DO_TIPO_DE_REUNIAO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
      <CampoDeData rotulo="De" valor={filtros.de} aoMudar={(de) => mudar({ de })} />
      <CampoDeData rotulo="Até" valor={filtros.ate} aoMudar={(ate) => mudar({ ate })} />
      {temFiltro(filtros) && <BotaoLimparFiltros aoLimpar={() => aoMudar(SEM_FILTROS_DAS_REUNIOES)} />}
    </div>
  )
}

type SeletorProps = {
  rotulo: string
  todos: string
  opcoes: { valor: string; rotulo: string }[]
  valor: string | null
  aoMudar: (valor: string | null) => void
}

function SeletorDoFiltro({ rotulo, todos, opcoes, valor, aoMudar }: SeletorProps) {
  const id = useId()
  return (
    <div className="filtro">
      <label htmlFor={id} className="filtro-rotulo">{rotulo}</label>
      <select id={id} className="filtro-seletor" value={valor ?? ''} onChange={(evento) => aoMudar(evento.target.value || null)}>
        <option value="">{todos}</option>
        {opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>)}
      </select>
    </div>
  )
}

type CampoDeDataProps = { rotulo: string; valor: string | null; aoMudar: (valor: string | null) => void }

function CampoDeData({ rotulo, valor, aoMudar }: CampoDeDataProps) {
  const id = useId()
  return (
    <div className="filtro">
      <label htmlFor={id} className="filtro-rotulo">{rotulo}</label>
      <input id={id} type="date" className="filtro-seletor" value={valor ?? ''} onChange={(evento) => aoMudar(evento.target.value || null)} />
    </div>
  )
}

function BotaoLimparFiltros({ aoLimpar }: { aoLimpar: () => void }) {
  return <button type="button" className="botao botao-secundario filtros-limpar" onClick={aoLimpar}>Limpar filtros</button>
}

export function NenhumaReuniaoComFiltros({ aoLimpar }: { aoLimpar: () => void }) {
  return (
    <div className="filtros-sem-resultado">
      <p className="cadastros-vazio">Nenhuma reunião com esses filtros.</p>
      <BotaoLimparFiltros aoLimpar={aoLimpar} />
    </div>
  )
}
