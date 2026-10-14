import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoLido } from '../../processos/tipos'
import { Icone } from '../Icone'
import { Pilula } from '../Pilula'
import { PilulaDaSituacao } from './PilulaDaSituacao'

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
          <PilulaDaSituacao situacao={processo.situacao} />
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
