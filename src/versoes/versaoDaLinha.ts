import { PAPEIS } from './rotulos'
import type { ArquivoDaVersao, PapelDoArquivo, Versao } from './tipos'

/** A leitura de `versoes` com o autor, a etapa e os arquivos (o tipo gerado do Supabase não acompanha as ligações). */
export const COLUNAS_DA_VERSAO =
  'id, numero, historica, enviada_em, observacao, autor:usuarios(nome), etapa:etapas(nome), ' +
  'arquivos_da_versao(id, papel, nome, formato, tamanho)'

export type LinhaDaVersao = {
  id: string
  numero: number
  historica: boolean
  enviada_em: string
  observacao: string | null
  autor: { nome: string } | null
  etapa: { nome: string } | null
  arquivos_da_versao: { id: string; papel: PapelDoArquivo; nome: string; formato: string; tamanho: number }[]
}

function ordemDoPapel(arquivo: ArquivoDaVersao): number {
  return PAPEIS.indexOf(arquivo.papel)
}

export function versaoDaLinha(linha: LinhaDaVersao): Versao {
  return {
    id: linha.id, numero: linha.numero, historica: linha.historica, enviadaEm: linha.enviada_em,
    autor: linha.autor?.nome ?? null, etapa: linha.etapa?.nome ?? null, observacao: linha.observacao,
    arquivos: [...linha.arquivos_da_versao].sort((a, b) => ordemDoPapel(a) - ordemDoPapel(b)),
  }
}
