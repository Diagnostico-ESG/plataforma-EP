import type { ReactNode, RefObject } from 'react'
import type { ProcessoLido } from '../../processos/tipos'
import { Icone } from '../Icone'
import { SeloDoSetor } from '../SeloDoSetor'

type CabecalhoDoVersoProps = {
  processo: ProcessoLido
  /** O nome recebe o foco ao abrir, para o leitor de tela começar por ele. */
  titulo: RefObject<HTMLHeadingElement | null>
  /** O "⋯" do processo. */
  acoes: ReactNode
  /** A linha de dados abaixo do nome: setor, macroprocesso, tipo, situação e a estrutura (pai e subprocessos). */
  dados?: ReactNode
  /** O botão azul da etapa atual (registrar revisão, aprovação ou publicação); nada nas outras etapas. */
  acaoPrincipal?: ReactNode
  aoFechar: () => void
}

export function CabecalhoDoVerso({ processo, titulo, acoes, acaoPrincipal, dados, aoFechar }: CabecalhoDoVersoProps) {
  return (
    <header className="verso-cabecalho">
      <SeloDoSetor sigla={processo.setorSigla} className="verso-selo-do-setor" />
      <div className="verso-identificacao">
        <h2 ref={titulo} tabIndex={-1} className="verso-titulo">{processo.nome}</h2>
        {dados}
      </div>
      <div className="verso-ferramentas">
        {acaoPrincipal}
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
