import { useCallback } from 'react'
import { useAtualizacoesDasPlanilhas } from '../../hooks/useAtualizacoesDasPlanilhas'
import { useCarregamento } from '../../hooks/useCarregamento'
import { usePedidoDeAtualizacao } from '../../hooks/usePedidoDeAtualizacao'
import type { ModuloDePlanilhas } from '../../planilhas/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { BarraDasPlanilhas } from './BarraDasPlanilhas'
import { ListaDeAtualizacoes } from './ListaDeAtualizacoes'

type AreaDasPlanilhasProps = { planilhas: ModuloDePlanilhas }

/** Aba "Planilhas": links, botão e as últimas tentativas. Quem protege os dados é a RLS; a aba só aparece ao administrador. */
export function AreaDasPlanilhas({ planilhas }: AreaDasPlanilhasProps) {
  const atualizacoes = useAtualizacoesDasPlanilhas(planilhas)
  const lerLinks = useCallback(() => planilhas.lerLinks(), [planilhas])
  const links = useCarregamento(lerLinks)
  const pedido = usePedidoDeAtualizacao(planilhas, atualizacoes.recarregar)
  const carregando = atualizacoes.estado.tipo === 'carregando' || links.estado.tipo === 'carregando'
  const comErro = atualizacoes.estado.tipo === 'erro' || links.estado.tipo === 'erro'

  function tentarDeNovo() {
    atualizacoes.tentarDeNovo()
    links.tentarDeNovo()
  }

  return (
    <section className="administracao" aria-labelledby="titulo-planilhas">
      <h2 id="titulo-planilhas" className="administracao-titulo">Planilhas</h2>
      {comErro && <ErroAoCarregar alvo="as planilhas" aoTentarDeNovo={tentarDeNovo} />}
      {!comErro && carregando && <p className="cadastros-vazio" role="status">Carregando planilhas…</p>}
      {atualizacoes.estado.tipo === 'pronto' && links.estado.tipo === 'pronto' && (
        <>
          <BarraDasPlanilhas links={links.estado.valor} emAndamento={atualizacoes.emAndamento}
            pedindo={pedido.pedindo} falha={pedido.falha} aoPedir={pedido.pedir} />
          <ListaDeAtualizacoes atualizacoes={atualizacoes.estado.valor} />
        </>
      )}
    </section>
  )
}
