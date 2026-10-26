import './Contexto.css'
import { useId } from 'react'
import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { hojeLocal, momentoDaModelagemPiloto } from '../../processos/textoDaModelagemPiloto'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { CampoDeDataDoProcesso } from './CampoDeDataDoProcesso'

type DataDaModelagemPilotoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

const TEXTO_DO_MOMENTO = { proxima: '· próxima', realizada: '· realizada' } as const

function textoDaFalhaDaModelagemPiloto(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A Data da modelagem piloto não foi salva: ${erro instanceof Error ? erro.message : String(erro)}.`
}

function momentoDaData(data: string) {
  const momento = momentoDaModelagemPiloto(data, hojeLocal())
  return momento && <span className="modelagem-momento">{TEXTO_DO_MOMENTO[momento]}</span>
}

/**
 * A data da modelagem piloto na coluna direita do verso: só um dado do processo, sem efeito nas etapas (ADR 0013).
 * "Marcar data" ou "Alterar data" vira ali mesmo o campo (spec, "Cartão e verso", Data da modelagem piloto).
 */
export function DataDaModelagemPiloto({ processo, processos, podeAlterar, aoMudar, aoSumir }: DataDaModelagemPilotoProps) {
  const idDoTitulo = useId()
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      <h3 id={idDoTitulo} className="contexto-titulo">Data da modelagem piloto</h3>
      <CampoDeDataDoProcesso data={processo.dataDaModelagemPiloto} rotulo="Data da modelagem piloto" podeAlterar={podeAlterar}
        gravar={(nova) => processos.marcarDataDaModelagemPiloto(processo.id, nova)} textoDaFalha={textoDaFalhaDaModelagemPiloto}
        complemento={momentoDaData} aoMudar={aoMudar} aoSumir={aoSumir} />
    </section>
  )
}
