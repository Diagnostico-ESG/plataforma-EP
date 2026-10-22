import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { colunaDeDestino } from '../../processos/destinoDoArrastar'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { CHAVE_DOS_CONCLUIDOS } from '../../processos/publicacao'
import { Pilula } from '../Pilula'
import { CartaoDoProcesso } from './CartaoDoProcesso'

type ColunaDoQuadroProps = {
  coluna: Coluna
  idEscolhido: string | null
  enderecoDoProcesso: (id: string) => string
  /** Quem não altera (Consulta) não arrasta cartão. */
  podeAlterar: boolean
  arrasto: ArrastoDoQuadro
  /** Por responsável o cartão mostra a etapa no lugar do avatar e não se arrasta. */
  agrupar: AgruparQuadroPor
}

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso, podeAlterar, arrasto, agrupar }: ColunaDoQuadroProps) {
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
        <span>{coluna.titulo}{coluna.inativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}</span>
        <span className="coluna-contagem">{coluna.processos.length}</span>
      </h3>
      <div className="coluna-cartoes">
        {coluna.chave === CHAVE_DOS_CONCLUIDOS && coluna.processos.length === 0 && (
          <p className="coluna-vazia">Nenhum processo concluído.</p>
        )}
        {coluna.processos.map((processo) => (
          <CartaoDoProcesso key={processo.id} processo={processo} escolhido={processo.id === idEscolhido}
            href={enderecoDoProcesso(processo.id)} arrastavel={podeAlterar && agrupar === 'etapa' && colunaDeDestino(processo) !== null}
            agrupadoPorResponsavel={agrupar === 'responsavel'} apagado={levantado?.id === processo.id} aoLevantar={() => arrasto.levantar(processo)} aoBaixar={arrasto.baixar} />
        ))}
      </div>
    </section>
  )
}
