import { CODIGO_DA_MODELAGEM_PILOTO, CODIGO_DA_TECNICA } from './codigosDasEtapas'
import type { ArquivosDoProcesso, EtapaDoCatalogo, ProcessoDaLista } from './tipos'

/** O que falta para sair da etapa: a versão piloto; ou a versão em sequência e o relatório numerado. */
export type PecaQueFalta = 'versao_piloto' | 'versao' | 'relatorio'

/** Uma etapa da ida a que faltam arquivos (ADR 0028): a tela pergunta antes de mover, e o banco grava o que faltava. */
export type TravaDeArquivos = { codigo: string; nome: string; falta: PecaQueFalta[] }

type Ida = {
  de: Pick<EtapaDoCatalogo, 'ordem'>
  para: Pick<EtapaDoCatalogo, 'ordem'>
  catalogo: EtapaDoCatalogo[]
  /** Sem ele a tela não sabe o que o processo tem e não pergunta; o banco aceita o movimento de qualquer jeito. */
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
 * Todas as etapas com arquivos que a ida atravessa e a que faltam arquivos, em ordem (ADR 0028). Uma etapa ativa confere
 * quando a ida sai dela, ou de antes dela, para depois dela; voltar e o processo que já estava adiante não perguntam.
 */
export function travasQueFaltam({ de, para, catalogo, arquivos }: Ida): TravaDeArquivos[] {
  if (!arquivos) return []
  const comArquivos = catalogo
    .filter((etapa) => etapa.ativa && (etapa.codigo === CODIGO_DA_MODELAGEM_PILOTO || etapa.codigo === CODIGO_DA_TECNICA))
    .sort((a, b) => a.ordem - b.ordem)
  return comArquivos
    .filter((etapa) => de.ordem <= etapa.ordem && para.ordem > etapa.ordem)
    .map((etapa) => ({ codigo: etapa.codigo, nome: etapa.nome, falta: pecasQueFaltam(etapa.codigo, arquivos) }))
    .filter((trava) => trava.falta.length > 0)
}

/** As etapas a que faltam arquivos na ida do processo ao destino; vazio sem etapa atual, sem o que o processo tem ou sem falta. */
export function travasDaIda(
  processo: Pick<ProcessoDaLista, 'etapaAtual' | 'arquivos'>, para: Pick<EtapaDoCatalogo, 'ordem'>, catalogo: EtapaDoCatalogo[],
): TravaDeArquivos[] {
  if (!processo.etapaAtual) return []
  return travasQueFaltam({ de: processo.etapaAtual, para, catalogo, arquivos: processo.arquivos })
}
