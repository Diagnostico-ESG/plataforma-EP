import { type KeyboardEvent, type ReactNode, useCallback, useState } from 'react'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ItemInexistente } from '../cadastros/ItemInexistente'
import { BotaoFechar, CabecalhoDoPainel } from './CabecalhoDoPainel'
import { CaminhoDoProcesso } from './CaminhoDoProcesso'
import { DadosDoProcesso } from './DadosDoProcesso'
import { HistoricoDoProcesso } from './HistoricoDoProcesso'
import './Painel.css'

type PainelDoProcessoProps = { processos: ModuloDeProcessos; id: string; aoFechar: () => void }

const TEXTO_DE_PROCESSO_INEXISTENTE = 'Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico.'

/** O painel abre à direita, por cima do Quadro; Esc fecha. */
export function PainelDoProcesso({ processos, id, aoFechar }: PainelDoProcessoProps) {
  const ler = useCallback(() => processos.lerProcesso(id), [processos, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  const fecharComEsc = (evento: KeyboardEvent) => {
    if (evento.key === 'Escape') aoFechar()
  }
  return (
    <aside className="painel" aria-label="Painel do processo" onKeyDown={fecharComEsc}>
      <ConteudoDoPainel estado={estado} processos={processos} id={id} aoFechar={aoFechar} aoTentarDeNovo={tentarDeNovo} />
    </aside>
  )
}

type ConteudoProps = PainelDoProcessoProps & { estado: EstadoDoCarregamento<ProcessoLido | null>; aoTentarDeNovo: () => void }

function ConteudoDoPainel({ estado, processos, id, aoFechar, aoTentarDeNovo }: ConteudoProps) {
  if (estado.tipo === 'carregando') return <SemProcesso aoFechar={aoFechar}><p role="status">Carregando processo…</p></SemProcesso>
  if (estado.tipo === 'erro') {
    return <SemProcesso aoFechar={aoFechar}><ErroAoCarregar alvo="o processo" aoTentarDeNovo={aoTentarDeNovo} /></SemProcesso>
  }
  if (estado.valor === null) {
    return (
      <SemProcesso aoFechar={aoFechar}>
        <ItemInexistente aoVoltar={aoFechar} texto={TEXTO_DE_PROCESSO_INEXISTENTE} rotuloDoBotao="Voltar" />
      </SemProcesso>
    )
  }
  return <ProcessoAberto processo={estado.valor} processos={processos} id={id} aoFechar={aoFechar} />
}

function SemProcesso({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return (
    <>
      <div className="painel-barra"><BotaoFechar aoFechar={aoFechar} /></div>
      <div className="painel-corpo">{children}</div>
    </>
  )
}

type Aba = 'detalhes' | 'historico'
type ProcessoAbertoProps = { processo: ProcessoLido; processos: ModuloDeProcessos; id: string; aoFechar: () => void }

function ProcessoAberto({ processo, processos, id, aoFechar }: ProcessoAbertoProps) {
  const [aba, setAba] = useState<Aba>('detalhes')
  return (
    <>
      <CabecalhoDoPainel processo={processo} aoFechar={aoFechar} />
      <div className="painel-abas" role="tablist" aria-label="Seções do processo">
        <BotaoDeAba rotulo="Detalhes" ativa={aba === 'detalhes'} aoEscolher={() => setAba('detalhes')} />
        <BotaoDeAba rotulo="Histórico" ativa={aba === 'historico'} aoEscolher={() => setAba('historico')} />
      </div>
      <div className="painel-corpo" role="tabpanel">
        {aba === 'detalhes' && <><CaminhoDoProcesso processo={processo} /><DadosDoProcesso processo={processo} /></>}
        {aba === 'historico' && <HistoricoDoProcesso processos={processos} id={id} />}
      </div>
    </>
  )
}

function BotaoDeAba({ rotulo, ativa, aoEscolher }: { rotulo: string; ativa: boolean; aoEscolher: () => void }) {
  return (
    <button type="button" role="tab" className="painel-aba" aria-selected={ativa} onClick={aoEscolher}>{rotulo}</button>
  )
}
