import { CODIGO_DA_MODELAGEM_PILOTO, CODIGO_DA_TECNICA } from './codigosDasEtapas'
import type { ArquivosDoProcesso, EtapaDoCatalogo, ProcessoDaLista } from './tipos'

/** O que falta para sair da etapa: a versão piloto; ou a versão em sequência e o relatório numerado. */
export type PecaQueFalta = 'versao_piloto' | 'versao' | 'relatorio'

export type TravaDeArquivos = { codigo: string; nome: string; falta: PecaQueFalta[] }

type Ida = {
  de: Pick<EtapaDoCatalogo, 'ordem'>
  para: Pick<EtapaDoCatalogo, 'ordem'>
  catalogo: EtapaDoCatalogo[]
  /** Sem ele a tela não sabe o que o processo tem e não trava; quem recusa, no fim, é o banco. */
  arquivos?: ArquivosDoProcesso
}

// A Modelagem piloto pede a versão piloto; uma versão em sequência também basta, porque depois dela a piloto já não entra
// e o processo ficaria sem saída (a mesma escolha do banco). A técnica pede a versão em sequência e o relatório numerado.
function pecasQueFaltam(codigo: string, arquivos: ArquivosDoProcesso): PecaQueFalta[] {
  if (codigo === CODIGO_DA_MODELAGEM_PILOTO) {
    return arquivos.versaoPiloto || arquivos.versaoEmSequencia ? [] : ['versao_piloto']
  }
  return [...(arquivos.versaoEmSequencia ? [] : ['versao' as const]), ...(arquivos.relatorioNumerado ? [] : ['relatorio' as const])]
}

/**
 * A primeira etapa com trava que a ida atravessa e a que faltam arquivos (ADR 0025), ou null. Uma etapa ativa com trava
 * confere quando a ida sai dela, ou de antes dela, para depois dela; voltar e o processo que já estava adiante não travam.
 */
export function primeiraTravaQueFalta({ de, para, catalogo, arquivos }: Ida): TravaDeArquivos | null {
  if (!arquivos) return null
  const comTrava = catalogo
    .filter((etapa) => etapa.ativa && (etapa.codigo === CODIGO_DA_MODELAGEM_PILOTO || etapa.codigo === CODIGO_DA_TECNICA))
    .sort((a, b) => a.ordem - b.ordem)
  for (const etapa of comTrava) {
    if (de.ordem > etapa.ordem || para.ordem <= etapa.ordem) continue
    const falta = pecasQueFaltam(etapa.codigo, arquivos)
    if (falta.length > 0) return { codigo: etapa.codigo, nome: etapa.nome, falta }
  }
  return null
}

/** A trava da ida do processo à etapa de destino; null sem etapa atual, sem o que o processo tem ou sem arquivo faltando. */
export function travaDaIda(
  processo: Pick<ProcessoDaLista, 'etapaAtual' | 'arquivos'>, para: Pick<EtapaDoCatalogo, 'ordem'>, catalogo: EtapaDoCatalogo[],
): TravaDeArquivos | null {
  if (!processo.etapaAtual) return null
  return primeiraTravaQueFalta({ de: processo.etapaAtual, para, catalogo, arquivos: processo.arquivos })
}
