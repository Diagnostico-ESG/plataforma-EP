import { barraDoCartao } from '../../processos/barraDoCartao'
import type { ProcessoDaLista } from '../../processos/tipos'

/** A barra fina do cartão: um pedaço por etapa do caminho. Discreta (cinza e azul): mostra o normal, não um alerta. */
export function BarraDeProgresso({ processo }: { processo: ProcessoDaLista }) {
  const barra = barraDoCartao(processo)
  if (barra === null) return null
  return (
    <span className="cartao-barra" role="img" aria-label={barra.nome}>
      {barra.pedacos.map((pedaco) => <span key={pedaco.codigo} className={`pedaco pedaco-${pedaco.estado}`} />)}
    </span>
  )
}
