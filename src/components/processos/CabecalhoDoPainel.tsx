import { ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoLido, SituacaoDoProcesso } from '../../processos/tipos'
import { Icone } from '../Icone'
import { Pilula, type SituacaoPilula } from '../Pilula'

const PILULA_DA_SITUACAO: Record<SituacaoDoProcesso, SituacaoPilula> = {
  em_andamento: 'informativa', suspenso: 'vencendo', cancelado: 'atraso', concluido: 'aprovado',
}

type CabecalhoDoPainelProps = { processo: ProcessoLido; aoFechar: () => void }

export function CabecalhoDoPainel({ processo, aoFechar }: CabecalhoDoPainelProps) {
  return (
    <header className="painel-cabecalho">
      <span className="cartao-sigla painel-sigla">{processo.setorSigla}</span>
      <div className="painel-identificacao">
        <h2 className="painel-titulo">{processo.nome}</h2>
        <p className="painel-macroprocesso">{processo.macroprocessoNome}</p>
        <div className="cartao-pilulas">
          <Pilula situacao="neutra">{ROTULO_DO_TIPO[processo.tipo]}</Pilula>
          <Pilula situacao={PILULA_DA_SITUACAO[processo.situacao]}>{ROTULO_DA_SITUACAO[processo.situacao]}</Pilula>
        </div>
      </div>
      <BotaoFechar aoFechar={aoFechar} />
    </header>
  )
}

export function BotaoFechar({ aoFechar }: { aoFechar: () => void }) {
  return (
    <button type="button" className="botao-icone painel-fechar" aria-label="Fechar o painel" title="Fechar o painel"
      onClick={aoFechar}>
      <Icone nome="fechar" />
    </button>
  )
}
