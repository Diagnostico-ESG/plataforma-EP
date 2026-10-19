import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { colunaDeDestino } from '../../processos/destinoDoArrastar'
import { CartaoDoProcesso } from './CartaoDoProcesso'

type ColunaDoQuadroProps = {
  coluna: Coluna
  idEscolhido: string | null
  enderecoDoProcesso: (id: string) => string
  /** Quem não altera (Consulta) não arrasta cartão. */
  podeAlterar: boolean
  arrasto: ArrastoDoQuadro
}

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso, podeAlterar, arrasto }: ColunaDoQuadroProps) {
  const { levantado } = arrasto
  const destino = levantado !== null && colunaDeDestino(levantado) === coluna.chave
  // Toda coluna aceita o soltar, para o aviso aparecer quando o cartão cai fora do destino; o realce fica só no destino.
  return (
    <section className={destino ? 'coluna coluna-destino' : 'coluna'} aria-label={coluna.titulo}
      onDragOver={(evento) => levantado && evento.preventDefault()}
      onDrop={(evento) => {
        evento.preventDefault()
        arrasto.soltarEm(coluna.chave)
      }}>
      <h3 className="coluna-titulo">
        {coluna.titulo} <span className="coluna-contagem">{coluna.processos.length}</span>
      </h3>
      <div className="coluna-cartoes">
        {coluna.processos.map((processo) => (
          <CartaoDoProcesso key={processo.id} processo={processo} escolhido={processo.id === idEscolhido}
            href={enderecoDoProcesso(processo.id)} arrastavel={podeAlterar && colunaDeDestino(processo) !== null}
            apagado={levantado?.id === processo.id} aoLevantar={() => arrasto.levantar(processo)} aoBaixar={arrasto.baixar} />
        ))}
      </div>
    </section>
  )
}
