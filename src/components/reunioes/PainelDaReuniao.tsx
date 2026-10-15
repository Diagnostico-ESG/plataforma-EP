import { type ReactNode, useCallback, useState } from 'react'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import { ROTULO_DO_TIPO_DE_REUNIAO, dataEHoraDaReuniao } from '../../reunioes/rotulos'
import type { ModuloDeReunioes, Reuniao } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ItemInexistente } from '../cadastros/ItemInexistente'
import { BotaoFechar } from '../processos/CabecalhoDoPainel'
import { fecharComEsc } from '../processos/fecharComEsc'
import '../processos/Painel.css'
import { DetalhesDaReuniao } from './DetalhesDaReuniao'
import { HistoricoDaReuniao } from './HistoricoDaReuniao'

type PainelDaReuniaoProps = {
  reunioes: ModuloDeReunioes
  id: string
  podeAlterar: boolean
  aoFechar: () => void
  /** A reunião mudou ou foi excluída: a lista atrás do painel precisa recarregar. */
  aoMudar: () => void
}

const TEXTO_DE_REUNIAO_INEXISTENTE = 'Esta reunião não existe mais. Ela pode ter sido excluída.'

/** O painel abre à direita, por cima da lista; Esc fecha. */
export function PainelDaReuniao(props: PainelDaReuniaoProps) {
  const { reunioes, id, aoFechar, aoMudar } = props
  const ler = useCallback(() => reunioes.lerReuniao(id), [reunioes, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)
  const aoSumir = () => {
    setSumiu(true)
    aoMudar()
  }
  const aposMudar = () => {
    recarregar()
    aoMudar()
  }
  return (
    <aside className="painel" aria-label="Painel da reunião" onKeyDown={fecharComEsc(aoFechar)}>
      <ConteudoDoPainel {...props} estado={sumiu ? { tipo: 'pronto', valor: null } : estado} aoTentarDeNovo={tentarDeNovo}
        aoMudar={aposMudar} aoSumir={aoSumir} />
    </aside>
  )
}

type ConteudoProps = PainelDaReuniaoProps & {
  estado: EstadoDoCarregamento<Reuniao | null>
  aoTentarDeNovo: () => void
  aoSumir: () => void
}

function ConteudoDoPainel({ estado, aoTentarDeNovo, ...painel }: ConteudoProps) {
  const { aoFechar } = painel
  if (estado.tipo === 'carregando') return <SemReuniao aoFechar={aoFechar}><p role="status">Carregando reunião…</p></SemReuniao>
  if (estado.tipo === 'erro') {
    return <SemReuniao aoFechar={aoFechar}><ErroAoCarregar alvo="a reunião" aoTentarDeNovo={aoTentarDeNovo} /></SemReuniao>
  }
  if (estado.valor === null) {
    return (
      <SemReuniao aoFechar={aoFechar}>
        <ItemInexistente aoVoltar={aoFechar} texto={TEXTO_DE_REUNIAO_INEXISTENTE} rotuloDoBotao="Voltar" />
      </SemReuniao>
    )
  }
  return <ReuniaoAberta reuniao={estado.valor} {...painel} />
}

function SemReuniao({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return (
    <>
      <div className="painel-barra"><BotaoFechar aoFechar={aoFechar} /></div>
      <div className="painel-corpo">{children}</div>
    </>
  )
}

type Aba = 'detalhes' | 'historico'
type ReuniaoAbertaProps = PainelDaReuniaoProps & { reuniao: Reuniao; aoSumir: () => void }

function ReuniaoAberta({ reuniao, reunioes, id, podeAlterar, aoFechar, aoMudar, aoSumir }: ReuniaoAbertaProps) {
  const [aba, setAba] = useState<Aba>('detalhes')
  const aoExcluir = () => {
    aoMudar()
    aoFechar()
  }
  return (
    <>
      <header className="painel-cabecalho">
        <span className="cartao-sigla painel-sigla">{reuniao.setorSigla}</span>
        <div className="painel-identificacao">
          <h2 className="painel-titulo">Reunião de {ROTULO_DO_TIPO_DE_REUNIAO[reuniao.tipo].toLowerCase()}</h2>
          <p className="painel-macroprocesso">{dataEHoraDaReuniao(reuniao)}</p>
        </div>
        <BotaoFechar aoFechar={aoFechar} />
      </header>
      <div className="painel-abas" role="tablist" aria-label="Seções da reunião">
        <BotaoDeAba rotulo="Detalhes" ativa={aba === 'detalhes'} aoEscolher={() => setAba('detalhes')} />
        <BotaoDeAba rotulo="Histórico" ativa={aba === 'historico'} aoEscolher={() => setAba('historico')} />
      </div>
      <div className="painel-corpo" role="tabpanel">
        {aba === 'detalhes' && (
          <DetalhesDaReuniao reunioes={reunioes} reuniao={reuniao} podeAlterar={podeAlterar} aoMudar={aoMudar}
            aoExcluir={aoExcluir} aoSumir={aoSumir} />
        )}
        {aba === 'historico' && <HistoricoDaReuniao reunioes={reunioes} id={id} />}
      </div>
    </>
  )
}

function BotaoDeAba({ rotulo, ativa, aoEscolher }: { rotulo: string; ativa: boolean; aoEscolher: () => void }) {
  return (
    <button type="button" role="tab" className="painel-aba" aria-selected={ativa} onClick={aoEscolher}>{rotulo}</button>
  )
}
