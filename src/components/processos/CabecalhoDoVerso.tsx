import type { ReactNode, RefObject } from 'react'
import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import type { ProcessoLido, SituacaoDoProcesso } from '../../processos/tipos'
import { Icone } from '../Icone'
import { Pilula, type SituacaoPilula } from '../Pilula'
import { SeloDoSetor } from '../SeloDoSetor'

type CabecalhoDoVersoProps = {
  processo: ProcessoLido
  /** O nome recebe o foco ao abrir, para o leitor de tela começar por ele. */
  titulo: RefObject<HTMLHeadingElement | null>
  /** O "⋯" do processo. */
  acoes: ReactNode
  aoFechar: () => void
}

// Só o que foge do normal ganha pílula (spec, "Cabeçalho"); o cancelado fica cinza no verso, sem o vermelho de falha.
const PILULA_FORA_DO_NORMAL: Partial<Record<SituacaoDoProcesso, SituacaoPilula>> = {
  suspenso: 'vencendo', cancelado: 'neutra', concluido: 'aprovado',
}

export function CabecalhoDoVerso({ processo, titulo, acoes, aoFechar }: CabecalhoDoVersoProps) {
  const pilula = PILULA_FORA_DO_NORMAL[processo.situacao]
  return (
    <header className="verso-cabecalho">
      <SeloDoSetor sigla={processo.setorSigla} cor={processo.setorCor ?? 1} className="verso-selo-do-setor" />
      <div className="verso-identificacao">
        <h2 ref={titulo} tabIndex={-1} className="verso-titulo">{processo.nome}</h2>
      </div>
      <div className="verso-ferramentas">
        {pilula && <Pilula situacao={pilula}>{ROTULO_DA_SITUACAO[processo.situacao]}</Pilula>}
        {acoes}
        <BotaoFecharJanela aoFechar={aoFechar} />
      </div>
    </header>
  )
}

/** "Fechar a janela", e não "Fechar o processo", que soaria como encerrar o processo. */
export function BotaoFecharJanela({ aoFechar }: { aoFechar: () => void }) {
  return (
    <button type="button" className="botao-icone verso-fechar" aria-label="Fechar a janela" title="Fechar a janela (Esc)"
      onClick={aoFechar}>
      <Icone nome="fechar" />
    </button>
  )
}
