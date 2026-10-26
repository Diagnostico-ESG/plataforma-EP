import { rotuloCurtoDoArquivo, rotuloDaVersao } from './rotulos'
import type { ArquivoDaVersao, Versao } from './tipos'

/** Um relatório que a versão mostra: o arquivo, o nome curto ("Relatório V2") e, se é o de uma versão anterior, o rótulo dela ("V7"). */
export type RelatorioDaVersao = { arquivo: ArquivoDaVersao; rotulo: string; daVersao: string | null }

function ehRelatorio(arquivo: ArquivoDaVersao): boolean {
  return arquivo.papel === 'relatorio'
}

/** Numerado primeiro, em ordem de número; o sem número (o da histórica e o .pdf antigo) depois. */
function emOrdemDeNumero(arquivos: ArquivoDaVersao[]): ArquivoDaVersao[] {
  return [...arquivos].sort((a, b) => (a.numeroDoRelatorio ?? Infinity) - (b.numeroDoRelatorio ?? Infinity))
}

function rotuloDoRelatorio(arquivo: ArquivoDaVersao, versao: Versao): string {
  if (arquivo.numeroDoRelatorio !== undefined) return `Relatório V${arquivo.numeroDoRelatorio}`
  return versao.historica ? `Relatório da ${rotuloDaVersao(versao)}` : rotuloCurtoDoArquivo(arquivo)
}

/** O último relatório numerado entre os ligados às versões de número menor que o da versão, com a versão a que ele pertence. */
function ultimoRelatorioAnterior(versao: Versao, todas: Versao[]): { arquivo: ArquivoDaVersao; dono: Versao } | null {
  const candidatos = todas
    .filter((outra) => outra.numero < versao.numero)
    .flatMap((dono) => dono.arquivos.filter(ehRelatorio).filter((arquivo) => arquivo.numeroDoRelatorio !== undefined).map((arquivo) => ({ arquivo, dono })))
  return candidatos.sort((a, b) => (b.arquivo.numeroDoRelatorio ?? 0) - (a.arquivo.numeroDoRelatorio ?? 0))[0] ?? null
}

/**
 * Os relatórios que a versão mostra (ADR 0026): os ligados a ela, ou, se não tem nenhum, o último numerado das versões
 * anteriores ("Relatório V2 (da V7)"). A histórica só mostra o seu; o .pdf antigo e o relatório da histórica, sem número,
 * não valem para as versões seguintes; antes do primeiro relatório numerado, nada.
 */
export function relatoriosDaVersao(versao: Versao, todas: Versao[]): RelatorioDaVersao[] {
  const proprios = emOrdemDeNumero(versao.arquivos.filter(ehRelatorio))
  if (proprios.length > 0) return proprios.map((arquivo) => ({ arquivo, rotulo: rotuloDoRelatorio(arquivo, versao), daVersao: null }))
  if (versao.historica) return []
  const anterior = ultimoRelatorioAnterior(versao, todas)
  if (!anterior) return []
  return [{ arquivo: anterior.arquivo, rotulo: rotuloDoRelatorio(anterior.arquivo, anterior.dono), daVersao: rotuloDaVersao(anterior.dono) }]
}

/** "Relatório V2" ou "Relatório V2 (da V7)": o que a linha do relatório escreve. */
export function textoDoRelatorio({ rotulo, daVersao }: RelatorioDaVersao): string {
  return daVersao ? `${rotulo} (da ${daVersao})` : rotulo
}

/** O número que o próximo relatório do processo recebe: o maior que existe + 1; sem nenhum, o 1 (a histórica e o .pdf antigo não contam). */
export function proximoNumeroDoRelatorio(versoes: Versao[]): number {
  const numeros = versoes.flatMap((versao) => versao.arquivos.map((arquivo) => arquivo.numeroDoRelatorio ?? 0))
  return Math.max(0, ...numeros) + 1
}
