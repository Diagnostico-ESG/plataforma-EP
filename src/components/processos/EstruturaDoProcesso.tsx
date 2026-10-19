import './Contexto.css'
import { useId } from 'react'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import type { ItemDaEstrutura, ProcessoLido } from '../../processos/tipos'

type EstruturaDoProcessoProps = { processo: ProcessoLido; enderecoDoProcesso: (id: string) => string }

/** "Faz parte de" no subprocesso ou "Subprocessos ({n})" no processo que os tem; cada um abre na mesma janela. Todos os perfis. */
export function EstruturaDoProcesso({ processo, enderecoDoProcesso }: EstruturaDoProcessoProps) {
  if (processo.processoPai) {
    return <SecaoDaEstrutura titulo="Faz parte de" itens={[processo.processoPai]} enderecoDoProcesso={enderecoDoProcesso} />
  }
  if (processo.subprocessos.length === 0) return null
  return (
    <SecaoDaEstrutura titulo={`Subprocessos (${processo.subprocessos.length})`} itens={processo.subprocessos}
      enderecoDoProcesso={enderecoDoProcesso} />
  )
}

/** "Revisão interna", "Revisão interna · Suspenso" ou, concluído sem etapa atual, "Concluído". */
function andamentoDoItem({ etapaAtual, situacao }: ItemDaEstrutura): string {
  const partes = [etapaAtual, situacao === 'em_andamento' ? null : ROTULO_DA_SITUACAO[situacao]]
  return partes.filter(Boolean).join(' · ')
}

type SecaoDaEstruturaProps = { titulo: string; itens: ItemDaEstrutura[]; enderecoDoProcesso: (id: string) => string }

function SecaoDaEstrutura({ titulo, itens, enderecoDoProcesso }: SecaoDaEstruturaProps) {
  const id = useId()
  return (
    <section className="contexto-secao" aria-labelledby={id}>
      <h3 id={id} className="contexto-titulo">{titulo}</h3>
      <ul className="estrutura-lista">
        {itens.map((item) => (
          <li key={item.id}>
            <a className="estrutura-link" href={enderecoDoProcesso(item.id)}>{item.nome}</a>
            <span className="estrutura-andamento">{andamentoDoItem(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
