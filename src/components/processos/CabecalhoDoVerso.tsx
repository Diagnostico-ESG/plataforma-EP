import type { ReactNode, RefObject } from 'react'
import { corDoMacroprocesso } from '../../processos/corDoMacroprocesso'
import { ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoLido, SituacaoDoProcesso } from '../../processos/tipos'
import { Icone } from '../Icone'
import { Pilula, type SituacaoPilula } from '../Pilula'

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
      <span className="cartao-sigla">{processo.setorSigla}</span>
      <div className="verso-identificacao">
        <h2 ref={titulo} tabIndex={-1} className="verso-titulo">{processo.nome}</h2>
        <p className="verso-subtitulo">
          <span className="verso-cor-do-macroprocesso" aria-hidden="true"
            style={{ background: corDoMacroprocesso(processo.macroprocessoId) }} />
          <span>{processo.macroprocessoNome}</span>
          <span aria-hidden="true">·</span>
          <span>{ROTULO_DO_TIPO[processo.tipo]}</span>
        </p>
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
