import { type ReactNode, useCallback } from 'react'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import { ROTULO_DO_TIPO_DE_REUNIAO, dataEHoraDaReuniao } from '../../reunioes/rotulos'
import type { ModuloDeReunioes, Reuniao } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ItemInexistente } from '../cadastros/ItemInexistente'
import { BotaoFechar } from '../processos/CabecalhoDoPainel'
import { fecharComEsc } from '../processos/fecharComEsc'
import '../processos/Painel.css'
import { DadosDaReuniao } from './DadosDaReuniao'

type PainelDaReuniaoProps = { reunioes: ModuloDeReunioes; id: string; aoFechar: () => void }

const TEXTO_DE_REUNIAO_INEXISTENTE = 'Esta reunião não existe mais. Ela pode ter sido excluída.'

/** O painel abre à direita, por cima da lista; Esc fecha. */
export function PainelDaReuniao({ reunioes, id, aoFechar }: PainelDaReuniaoProps) {
  const ler = useCallback(() => reunioes.lerReuniao(id), [reunioes, id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return (
    <aside className="painel" aria-label="Painel da reunião" onKeyDown={fecharComEsc(aoFechar)}>
      <ConteudoDoPainel estado={estado} aoTentarDeNovo={tentarDeNovo} aoFechar={aoFechar} />
    </aside>
  )
}

type ConteudoProps = { estado: EstadoDoCarregamento<Reuniao | null>; aoTentarDeNovo: () => void; aoFechar: () => void }

function ConteudoDoPainel({ estado, aoTentarDeNovo, aoFechar }: ConteudoProps) {
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
  return (
    <>
      <header className="painel-cabecalho">
        <span className="cartao-sigla painel-sigla">{estado.valor.setorSigla}</span>
        <div className="painel-identificacao">
          <h2 className="painel-titulo">Reunião de {ROTULO_DO_TIPO_DE_REUNIAO[estado.valor.tipo].toLowerCase()}</h2>
          <p className="painel-macroprocesso">{dataEHoraDaReuniao(estado.valor)}</p>
        </div>
        <BotaoFechar aoFechar={aoFechar} />
      </header>
      <div className="painel-corpo"><DadosDaReuniao reuniao={estado.valor} /></div>
    </>
  )
}

function SemReuniao({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return (
    <>
      <div className="painel-barra"><BotaoFechar aoFechar={aoFechar} /></div>
      <div className="painel-corpo">{children}</div>
    </>
  )
}
