import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { podeArrastar } from '../../processos/destinoDoArrastar'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { CHAVE_DOS_CONCLUIDOS } from '../../processos/publicacao'
import type { EtapaDoCatalogo } from '../../processos/tipos'
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
  /** As etapas do catálogo: o cartão e os selos precisam delas. */
  etapas: EtapaDoCatalogo[]
}

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso, podeAlterar, arrasto, agrupar, etapas }: ColunaDoQuadroProps) {
  const { levantado } = arrasto
  // Só as colunas de etapa recebem o cartão (o Quadro por responsável não arrasta), e a coluna sob o cartão ganha o realce.
  const recebe = levantado !== null && agrupar === 'etapa'
  const realce = recebe && arrasto.sobre === coluna.chave
  return (
    <section className={realce ? 'coluna coluna-destino' : 'coluna'} aria-label={coluna.titulo}
      onDragEnter={() => recebe && arrasto.passarPor(coluna.chave)}
      onDragOver={(evento) => {
        if (!recebe) return
        evento.preventDefault()
        arrasto.passarPor(coluna.chave)
      }}
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
            href={enderecoDoProcesso(processo.id)} arrastavel={podeAlterar && agrupar === 'etapa' && podeArrastar(processo)}
            agrupadoPorResponsavel={agrupar === 'responsavel'} etapas={etapas} apagado={levantado?.id === processo.id}
            aoLevantar={() => arrasto.levantar(processo)} aoBaixar={arrasto.baixar} />
        ))}
      </div>
    </section>
  )
}
