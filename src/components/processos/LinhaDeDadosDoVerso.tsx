import type { ProcessoLido } from '../../processos/tipos'
import { EstruturaDoProcesso } from './EstruturaDoProcesso'
import { SobreDoProcesso } from './SobreDoProcesso'

type LinhaDeDadosDoVersoProps = {
  processo: ProcessoLido
  enderecoDoProcesso: (id: string) => string
  /** O verso confere as anotações antes de trocar de processo (pai ou subprocesso). */
  aoAbrir: (endereco: string) => void
}

/** A linha de dados abaixo do nome (spec, "Verso enxuto"): setor, macroprocesso, tipo e situação, com o pai e os subprocessos ao lado. */
export function LinhaDeDadosDoVerso({ processo, enderecoDoProcesso, aoAbrir }: LinhaDeDadosDoVersoProps) {
  return (
    <div className="verso-dados">
      <SobreDoProcesso processo={processo} />
      <EstruturaDoProcesso processo={processo} enderecoDoProcesso={enderecoDoProcesso} aoAbrir={aoAbrir} />
    </div>
  )
}
