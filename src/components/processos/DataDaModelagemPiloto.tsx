import './Contexto.css'
import { TravaDoBanco } from '../../acesso/falhasDeGravacao'
import { hojeEmBrasilia } from '../../lib/datas'
import { podeRegistrarDataDaModelagem } from '../../processos/dataDaModelagemPiloto'
import { fraseDaModelagemNoFuturo } from '../../processos/frasesDaModelagemPiloto'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { CampoDeDataDoProcesso, type TextosDaData } from './CampoDeDataDoProcesso'

type DataDaModelagemPilotoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** Quem tem perfil para alterar; a situação e a etapa do processo decidem o resto. */
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

const TEXTOS: TextosDaData = { antes: 'Realizada em ', semData: null, registrar: 'Registrar data', alterar: 'Alterar data' }

function textoDaFalhaDaModelagemPiloto(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A Data da modelagem piloto não foi salva: ${erro instanceof Error ? erro.message : String(erro)}.`
}

/**
 * A data da modelagem piloto na linha da etapa Modelagem piloto: só a de realização, nunca depois de hoje (ADR 0035). Quem pode
 * a registra, altera ou apaga ali mesmo; para os outros ela é só leitura e só aparece se existir. Não mexe em etapa nem em etiqueta.
 */
export function DataDaModelagemPiloto({ processo, processos, podeAlterar, aoMudar, aoSumir }: DataDaModelagemPilotoProps) {
  const editavel = podeRegistrarDataDaModelagem(processo, podeAlterar)
  if (!editavel && !processo.dataDaModelagemPiloto) return null
  return (
    <div className="etapa-modelagem">
      <CampoDeDataDoProcesso data={processo.dataDaModelagemPiloto ?? null} rotulo="Data da modelagem piloto" podeAlterar={editavel}
        gravar={(nova) => processos.marcarDataDaModelagemPiloto(processo.id, nova)} textoDaFalha={textoDaFalhaDaModelagemPiloto}
        maximo={hojeEmBrasilia()} textoDaDataAlemDoMaximo={fraseDaModelagemNoFuturo} textos={TEXTOS}
        aoMudar={aoMudar} aoSumir={aoSumir} />
    </div>
  )
}
