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

/** Nova: o número é o da prévia (maior + 1). Histórica: o número é digitado, e os arquivos são os que existirem. */
export type ModoDoFormulario = { tipo: 'nova'; numero: number } | { tipo: 'historica' }

export const PAPEIS_OBRIGATORIOS: readonly PapelDoArquivo[] = ['bpmn', 'png']

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

/** O número digitado da versão histórica: só dígitos, inteiro maior que zero; senão null. */
export function lerNumeroHistorico(texto: string): number | null {
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

/** Se o botão do formulário se habilita: a nova pede o par, a histórica pede o número e o .bpm (ou o par). */
export function podeSubmeter(modo: ModoDoFormulario, arquivos: { escolhidos: Escolhidos; recusas: RecusasDosCampos; conferindo: boolean },
  numero: number | null): boolean {
  const { escolhidos, recusas, conferindo } = arquivos
  if (modo.tipo === 'historica') return podeRegistrarHistorica(escolhidos, recusas, conferindo, numero)
  return podeEnviar(escolhidos, recusas, conferindo)
}

/** "Enviando 2 de 3…": o arquivo que está indo agora, sem passar do total enquanto a versão é registrada. */
export function textoDoProgresso({ enviados, total }: Progresso): string {
  return `Enviando ${Math.min(enviados + 1, total)} de ${total}…`
}

/** O nome que o arquivo vai ter no Drive e na lista (a mesma função que a função do servidor usa). */
export function nomeNaPrevia(processo: { setorSigla: string; nome: string }, numero: number, papel: PapelDoArquivo,
  arquivo: File, historica = false): string {
  return nomePadrao({
    sigla: processo.setorSigla, numero, historica, nomeDoProcesso: processo.nome, papel,
    extensao: extensaoDoNome(arquivo.name),
  })
}

export function textoDaFalhaDoEnvio(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `A versão não foi registrada: ${motivo}. Os arquivos escolhidos continuam no formulário.`
}
