import { useId } from 'react'
import type { ItemDaEstrutura, ProcessoLido } from '../../processos/tipos'

/** "Processo pai" no subprocesso ou "Subprocessos" no processo que os tem; cada um abre o seu painel. Todos os perfis. */
export function EstruturaDoProcesso({ processo }: { processo: ProcessoLido }) {
  if (processo.processoPai) return <SecaoDaEstrutura titulo="Processo pai" itens={[processo.processoPai]} />
  if (processo.subprocessos.length > 0) return <SecaoDaEstrutura titulo="Subprocessos" itens={processo.subprocessos} />
  return null
}

function SecaoDaEstrutura({ titulo, itens }: { titulo: string; itens: ItemDaEstrutura[] }) {
  const id = useId()
  return (
    <section className="painel-estrutura" aria-labelledby={id}>
      <h3 id={id} className="painel-subtitulo">{titulo}</h3>
      <ul className="painel-estrutura-lista">
        {itens.map((item) => (
          <li key={item.id}><a className="painel-link" href={`#/processos/${item.id}`}>{item.nome}</a></li>
        ))}
      </ul>
    </section>
  )
}
