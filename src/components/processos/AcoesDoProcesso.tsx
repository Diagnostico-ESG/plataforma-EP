import { useState } from 'react'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { PEDIDOS_POR_SITUACAO, type PedidoDeSituacao, TEXTOS_DA_SITUACAO } from '../../processos/pedidosDeSituacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { type ItemDoMenu, MenuDeAcoes } from '../MenuDeAcoes'
import { ReclassificacaoDoProcesso } from './AcoesDeReclassificacao'
import { JanelaDeSituacao } from './AcoesDeSituacao'

type PedidoDoProcesso = PedidoDeSituacao | 'reclassificar' | 'excluir'

type AcoesDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  executar: Executar
  aoAbrirHistorico: () => void
  aoEditar: () => void
  aoExcluir: () => void
  aoMudar: () => void
}

const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer.'

/**
 * O "⋯" do processo, em três grupos (spec, "Menu '⋯' do processo"), com as janelas que cada ação abre.
 * A Consulta vê só o Histórico; esconder as outras é conveniência, quem protege é a RLS.
 */
export function AcoesDoProcesso(props: AcoesDoProcessoProps) {
  const { processo, processos, executar, aoExcluir, aoMudar } = props
  const [pedido, setPedido] = useState<PedidoDoProcesso | null>(null)
  const fechar = () => setPedido(null)
  const situacao = pedido === 'reclassificar' || pedido === 'excluir' ? null : pedido
  return (
    <>
      <MenuDeAcoes rotulo="Ações do processo" grupos={gruposDoMenu(props, setPedido)} />
      <JanelaDeSituacao processo={processo} processos={processos} pedido={situacao} executar={executar} aoFechar={fechar}
        aoMudar={aoMudar} />
      {pedido === 'reclassificar' && (
        <ReclassificacaoDoProcesso processo={processo} processos={processos} executar={executar} aoFechar={fechar}
          aoMudar={aoMudar} />
      )}
      <JanelaDeConfirmacao aberta={pedido === 'excluir'} titulo={`Excluir o processo ${processo.nome}?`}
        texto={TEXTO_DA_EXCLUSAO} rotuloDaAcao="Excluir processo" aoFechar={fechar}
        aoConfirmar={() => executar(() => processos.excluirProcesso(processo.id), aoExcluir)} />
    </>
  )
}

function gruposDoMenu(props: AcoesDoProcessoProps, pedir: (pedido: PedidoDoProcesso) => void): ItemDoMenu[][] {
  const historico: ItemDoMenu = { rotulo: 'Histórico', aoEscolher: props.aoAbrirHistorico }
  if (!props.podeAlterar) return [[historico]]
  const situacao = PEDIDOS_POR_SITUACAO[props.processo.situacao]
    .map((chave): ItemDoMenu => ({ rotulo: TEXTOS_DA_SITUACAO[chave].item, aoEscolher: () => pedir(chave) }))
  return [
    [historico, { rotulo: 'Editar', aoEscolher: props.aoEditar }, { rotulo: 'Reclassificar', aoEscolher: () => pedir('reclassificar') }],
    situacao,
    [{ rotulo: 'Excluir', aoEscolher: () => pedir('excluir'), perigoso: true }],
  ]
}
