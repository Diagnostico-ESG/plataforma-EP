import './Contexto.css'
import { type MouseEvent, useId } from 'react'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import type { ItemDaEstrutura, ProcessoLido } from '../../processos/tipos'

type EstruturaDoProcessoProps = {
  processo: ProcessoLido
  enderecoDoProcesso: (id: string) => string
  /** Chamado com o endereço do clique comum no link; o verso confere as anotações antes de trocar de processo. */
  aoAbrir: (endereco: string) => void
}

/** "Faz parte de" no subprocesso ou "Subprocessos ({n})" no processo que os tem; cada um abre na mesma janela. Todos os perfis. */
export function EstruturaDoProcesso({ processo, enderecoDoProcesso, aoAbrir }: EstruturaDoProcessoProps) {
  if (processo.processoPai) {
    return <SecaoDaEstrutura titulo="Faz parte de" itens={[processo.processoPai]} enderecoDoProcesso={enderecoDoProcesso} aoAbrir={aoAbrir} />
  }
  if (processo.subprocessos.length === 0) return null
  return (
    <SecaoDaEstrutura titulo={`Subprocessos (${processo.subprocessos.length})`} itens={processo.subprocessos}
      enderecoDoProcesso={enderecoDoProcesso} aoAbrir={aoAbrir} />
  )
}

// Ctrl, Shift, Alt, Cmd e o botão do meio seguem o comportamento normal do link (nova aba).
function abrirNaMesmaJanela(aoAbrir: (endereco: string) => void) {
  return (evento: MouseEvent<HTMLAnchorElement>) => {
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return
    evento.preventDefault()
    aoAbrir(evento.currentTarget.getAttribute('href') ?? '')
  }
}

/** "Revisão interna", "Revisão interna · Suspenso" ou, concluído sem etapa atual, "Concluído". */
function andamentoDoItem({ etapaAtual, situacao }: ItemDaEstrutura): string {
  const partes = [etapaAtual, situacao === 'em_andamento' ? null : ROTULO_DA_SITUACAO[situacao]]
  return partes.filter(Boolean).join(' · ')
}

type SecaoDaEstruturaProps = EstruturaDosItens & { titulo: string; itens: ItemDaEstrutura[] }
type EstruturaDosItens = Pick<EstruturaDoProcessoProps, 'enderecoDoProcesso' | 'aoAbrir'>

function SecaoDaEstrutura({ titulo, itens, enderecoDoProcesso, aoAbrir }: SecaoDaEstruturaProps) {
  const id = useId()
  return (
    <section className="contexto-secao" aria-labelledby={id}>
      <h3 id={id} className="contexto-titulo">{titulo}</h3>
      <ul className="estrutura-lista">
        {itens.map((item) => (
          <li key={item.id}>
            <a className="estrutura-link" href={enderecoDoProcesso(item.id)} onClick={abrirNaMesmaJanela(aoAbrir)}>{item.nome}</a>
            <span className="estrutura-andamento">{andamentoDoItem(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
