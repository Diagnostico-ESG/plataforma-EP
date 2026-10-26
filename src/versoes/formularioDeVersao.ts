import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { nomePadrao } from '../../supabase/functions/_shared/nomePadrao.ts'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { PAPEIS } from './rotulos'
import type { ArquivoEscolhido, PapelDoArquivo } from './tipos'

/** O arquivo escolhido em cada campo do formulário. */
export type Escolhidos = Partial<Record<PapelDoArquivo, File>>
/** A frase da conferência que falhou, por campo. */
export type RecusasDosCampos = Partial<Record<PapelDoArquivo, string>>
export type Progresso = { enviados: number; total: number }

/**
 * Em sequência: o número é o da prévia (maior + 1). Piloto e histórica: o número é digitado; a histórica leva os arquivos
 * que existirem, a piloto e a em sequência, o .bpm (ADR 0025).
 */
export type ModoDoFormulario =
  | { tipo: 'sequencia'; numero: number; numeroDoRelatorio: number } | { tipo: 'piloto'; numeroSugerido: number } | { tipo: 'historica' }

export const PAPEIS_OBRIGATORIOS: readonly PapelDoArquivo[] = ['bpm']

/** Os campos de arquivo do formulário: a piloto não leva relatório (ele se envia sozinho); a histórica leva o dela, sem número. */
export function papeisDoFormulario(modo: ModoDoFormulario): readonly PapelDoArquivo[] {
  return modo.tipo === 'piloto' ? PAPEIS.filter((papel) => papel !== 'relatorio') : PAPEIS
}

export function arquivosDoPedido(escolhidos: Escolhidos): ArquivoEscolhido[] {
  return PAPEIS.flatMap((papel) => {
    const arquivo = escolhidos[papel]
    return arquivo ? [{ papel, arquivo }] : []
  })
}

export function podeEnviar(escolhidos: Escolhidos, recusas: RecusasDosCampos, conferindo: boolean): boolean {
  if (conferindo || Object.values(recusas).some(Boolean)) return false
  return PAPEIS_OBRIGATORIOS.every((papel) => escolhidos[papel])
}

/** O número digitado da versão histórica ou piloto: só dígitos, inteiro maior que zero; senão null. */
export function lerNumeroDigitado(texto: string): number | null {
  if (!/^[0-9]+$/.test(texto)) return null
  const numero = Number(texto)
  return numero > 0 ? numero : null
}

/** A histórica basta com o .bpm, ou com o .bpmn e o .png; o relatório é opcional (o banco confere de novo). */
export function podeRegistrarHistorica(escolhidos: Escolhidos, recusas: RecusasDosCampos, conferindo: boolean,
  numero: number | null): boolean {
  if (numero === null || conferindo || Object.values(recusas).some(Boolean)) return false
  return Boolean(escolhidos.bpm || (escolhidos.bpmn && escolhidos.png))
}

/** Se o botão do formulário se habilita: a em sequência pede o .bpm, a piloto o número e o .bpm, a histórica o número e o .bpm (ou o par). */
export function podeSubmeter(modo: ModoDoFormulario, arquivos: { escolhidos: Escolhidos; recusas: RecusasDosCampos; conferindo: boolean },
  numero: number | null): boolean {
  const { escolhidos, recusas, conferindo } = arquivos
  if (modo.tipo === 'historica') return podeRegistrarHistorica(escolhidos, recusas, conferindo, numero)
  if (modo.tipo === 'piloto' && numero === null) return false
  return podeEnviar(escolhidos, recusas, conferindo)
}

/** "Enviando 2 de 3…": o arquivo que está indo agora, sem passar do total enquanto a versão é registrada. */
export function textoDoProgresso({ enviados, total }: Progresso): string {
  return `Enviando ${Math.min(enviados + 1, total)} de ${total}…`
}

/** O nome que o arquivo vai ter no Drive e na lista (a mesma função que a função do servidor usa). */
export function nomeNaPrevia(processo: { setorSigla: string; nome: string }, numero: number, papel: PapelDoArquivo,
  arquivo: File, tipo: 'historica' | 'piloto' | 'sequencia' = 'sequencia', numeroDoRelatorio?: number): string {
  return nomePadrao({
    sigla: processo.setorSigla, numero, historica: tipo === 'historica', piloto: tipo === 'piloto', numeroDoRelatorio,
    nomeDoProcesso: processo.nome, papel, extensao: extensaoDoNome(arquivo.name),
  })
}

/** "Relatório V3, acompanha a V8": o que o formulário do relatório diz antes do envio (a versão é a mais recente que não é histórica). */
export function previaDoRelatorio({ numeroDaVersao, piloto, numeroDoRelatorio }: { numeroDaVersao: number; piloto: boolean; numeroDoRelatorio: number }): string {
  return `Relatório V${numeroDoRelatorio}, acompanha a V${numeroDaVersao}${piloto ? 'P' : ''}`
}

export function textoDaFalhaDoEnvio(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `A versão não foi registrada: ${motivo}. Os arquivos escolhidos continuam no formulário.`
}

export function textoDaFalhaDoAcrescimo(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `O arquivo não foi registrado: ${motivo}. Tente de novo.`
}

/** O relatório sozinho pede só o arquivo do relatório, sem recusa e sem conferência em andamento. */
export function podeEnviarRelatorio(escolhidos: Escolhidos, recusas: RecusasDosCampos, conferindo: boolean): boolean {
  if (conferindo || Object.values(recusas).some(Boolean)) return false
  return Boolean(escolhidos.relatorio)
}

export function textoDaFalhaDoRelatorio(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `O relatório não foi registrado: ${motivo}. O arquivo escolhido continua no formulário.`
}

/** Na troca, o arquivo novo é do mesmo tipo do que sai: a extensão é a do arquivo guardado. Null se serve. */
export function recusaDoTipoNaTroca(formatoDoQueSai: string, novo: File): string | null {
  const extensao = extensaoDoNome(novo.name)
  if (extensao === formatoDoQueSai) return null
  const recebida = extensao ? `.${extensao}` : 'sem extensão'
  return `Escolha um arquivo .${formatoDoQueSai}, o mesmo tipo do arquivo que sai. Recebido: ${recebida}.`
}

/** A troca pede o arquivo novo escolhido, sem recusa (do papel ou do tipo) e sem conferência em andamento. */
export function podeTrocarArquivo(escolhido: File | undefined, recusa: string | null, conferindo: boolean): boolean {
  return escolhido !== undefined && recusa === null && !conferindo
}

export function textoDaFalhaDaTroca(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `A troca não foi registrada: ${motivo}. O arquivo escolhido continua no formulário.`
}
