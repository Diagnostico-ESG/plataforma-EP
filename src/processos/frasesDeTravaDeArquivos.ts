// As frases da trava de arquivos (ADR 0025), as mesmas no módulo real e no falso: o que falta para sair da Modelagem piloto
// ou da Relatório e modelagem técnica.
import type { TravaDeArquivos } from './travaDeArquivos'

export const FRASE_DA_TRAVA_DA_MODELAGEM = 'Para sair da Modelagem piloto, envie a versão piloto (.bpm).'

const O_QUE_FALTA_NA_TECNICA: Record<string, string> = {
  versao: 'a versão', relatorio: 'o relatório', versao_e_relatorio: 'a versão e o relatório',
}

/** `valor` é o que o banco manda depois de "trava_tecnica:" (versao, relatorio ou versao_e_relatorio). */
export function fraseDaTravaDaTecnica(valor: string): string {
  const faltando = O_QUE_FALTA_NA_TECNICA[valor]
  if (!faltando) throw new Error(`Valor "${valor}" não é do banco; esperado versao, relatorio ou versao_e_relatorio.`)
  return `Para sair da Relatório e modelagem técnica, envie ${faltando}.`
}

/** A frase da recusa para a trava que a tela achou (a falsa recusa com ela, como o banco). */
export function fraseDaTrava({ codigo, falta }: TravaDeArquivos): string {
  return codigo === 'modelagem' ? FRASE_DA_TRAVA_DA_MODELAGEM : fraseDaTravaDaTecnica(falta.join('_e_'))
}
