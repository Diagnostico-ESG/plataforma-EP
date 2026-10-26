import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { hojeLocal } from '../../processos/textoDaModelagemPiloto'
import type { ProcessoLido } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { CampoDeDataDoProcesso } from './CampoDeDataDoProcesso'

type DataDaValidacaoProps = {
  processo: ProcessoLido
  revisoes: Pick<ModuloDeRevisoes, 'registrarDataDaValidacao'>
  podeAlterar: boolean
  aoMudar: () => void
}

function textoDaFalhaDaValidacao(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A data da validação não foi salva: ${erro instanceof Error ? erro.message : String(erro)}.`
}

/**
 * A Data da validação no Agora da Validação com o setor (ADR 0023): o dia em que o setor validou o fluxo, opcional, no mesmo
 * padrão da Data da modelagem piloto. Marcar, alterar e apagar gravam na hora; o banco recusa data futura. A Consulta só lê.
 */
export function DataDaValidacao({ processo, revisoes, podeAlterar, aoMudar }: DataDaValidacaoProps) {
  return (
    <div className="agora-validacao" role="group" aria-label="Data da validação">
      <span className="agora-campo">Data da validação</span>
      <CampoDeDataDoProcesso data={processo.dataDaValidacao ?? null} rotulo="Data da validação" podeAlterar={podeAlterar}
        gravar={(nova) => revisoes.registrarDataDaValidacao(processo.id, nova)} textoDaFalha={textoDaFalhaDaValidacao}
        maximo={hojeLocal()} aoMudar={aoMudar} aoSumir={aoMudar} />
    </div>
  )
}
