import { relatoriosDaVersao, textoDoRelatorio } from './relatorioQueVale'
import { emOrdemDeExibicao, ordenarVersoes, rotuloCurtoDoArquivo, rotuloDaVersao } from './rotulos'
import type { ArquivoDaVersao, PapelDoArquivo, Versao } from './tipos'

export type ArquivoNaArvore = { arquivo: ArquivoDaVersao; rotulo: string }

/** O que a linha dos arquivos da árvore mostra: a versão mais recente, o selo "Aprovada" e um link por arquivo. */
export type ArquivosDaArvore = { rotulo: string; aprovada: boolean; arquivos: ArquivoNaArvore[] }

// Anexos e o .pdf da aprovação não entram: a árvore mostra só o fluxo e o relatório (spec, "Linha dos arquivos").
const DO_FLUXO: readonly PapelDoArquivo[] = ['png', 'bpm', 'bpmn']

/**
 * A versão mais recente do processo com os arquivos dela, na ordem do destaque do verso (.png, .bpm, relatório, .bpmn), e
 * o relatório que vale para ela (o dela ou o último numerado das anteriores). Sem versão: null.
 */
export function arquivosDaVersaoMaisRecente(versoes: Versao[]): ArquivosDaArvore | null {
  const [maisRecente] = ordenarVersoes(versoes)
  if (!maisRecente) return null
  const doFluxo = emOrdemDeExibicao(maisRecente.arquivos.filter(({ papel }) => DO_FLUXO.includes(papel)))
  const deFluxo = (papel: PapelDoArquivo) => doFluxo.filter((arquivo) => arquivo.papel === papel).map(rotuloDoFluxo)
  const relatorios = relatoriosDaVersao(maisRecente, versoes).map((relatorio) => ({ arquivo: relatorio.arquivo, rotulo: textoDoRelatorio(relatorio) }))
  return {
    rotulo: rotuloDaVersao(maisRecente), aprovada: maisRecente.aprovada === true,
    arquivos: [...deFluxo('png'), ...deFluxo('bpm'), ...relatorios, ...deFluxo('bpmn')],
  }
}

function rotuloDoFluxo(arquivo: ArquivoDaVersao): ArquivoNaArvore {
  return { arquivo, rotulo: rotuloCurtoDoArquivo(arquivo) }
}
