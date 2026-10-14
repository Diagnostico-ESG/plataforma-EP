import { useId } from 'react'
import type { ItemDaEstrutura, ProcessoLido } from '../../processos/tipos'

type EstruturaDoProcessoProps = { processo: ProcessoLido; enderecoDoProcesso: (id: string) => string }

/** "Processo pai" no subprocesso ou "Subprocessos" no processo que os tem; cada um abre o seu painel. Todos os perfis. */
export function EstruturaDoProcesso({ processo, enderecoDoProcesso }: EstruturaDoProcessoProps) {
  if (processo.processoPai) {
    return <SecaoDaEstrutura titulo="Processo pai" itens={[processo.processoPai]} enderecoDoProcesso={enderecoDoProcesso} />
  }
  if (processo.subprocessos.length === 0) return null
  return <SecaoDaEstrutura titulo="Subprocessos" itens={processo.subprocessos} enderecoDoProcesso={enderecoDoProcesso} />
}

type SecaoDaEstruturaProps = { titulo: string; itens: ItemDaEstrutura[]; enderecoDoProcesso: (id: string) => string }

function SecaoDaEstrutura({ titulo, itens, enderecoDoProcesso }: SecaoDaEstruturaProps) {
  const id = useId()
  return (
    <section className="painel-estrutura" aria-labelledby={id}>
      <h3 id={id} className="painel-subtitulo">{titulo}</h3>
      <ul className="painel-estrutura-lista">
        {itens.map((item) => (
          <li key={item.id}><a className="painel-link" href={enderecoDoProcesso(item.id)}>{item.nome}</a></li>
        ))}
      </ul>
    </section>
  )
}
