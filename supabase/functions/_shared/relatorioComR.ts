// Relatório numerado com R (documentos-versoes, mudança de 2026-11-13; ADR 0047). Arquivo puro, sem Deno nem npm:, testado no
// Vitest e usado também pela tela (a aba Importação conta os relatórios com a mesma regra). A regra do nome é a mesma da função
// public.renomear_relatorio_para_r do banco: só o "_Relatório V<número guardado>" do fim do nome vira "_Relatório R<número>".
import { FORMATO_UUID, eCorpo, falhar, lerTexto, tipoDe, type Validacao } from './decisao.ts'

export type SituacaoDoNome = { tipo: 'a_renomear'; nomeNovo: string } | { tipo: 'com_r' } | { tipo: 'fora_do_padrao' }

const FIM_DO_RELATORIO = /_Relatório ([VR])(\d+)(\.[^.]+)$/

/** Se o relatório se renomeia (e com que nome), se já está com R ou se o nome foge do padrão com o número guardado. */
export function situacaoDoNomeDoRelatorio(nome: string, numero: number | null): SituacaoDoNome {
  const fim = FIM_DO_RELATORIO.exec(nome)
  if (numero === null || !fim || Number(fim[2]) !== numero) return { tipo: 'fora_do_padrao' }
  if (fim[1] === 'R') return { tipo: 'com_r' }
  return { tipo: 'a_renomear', nomeNovo: `${nome.slice(0, fim.index)}_Relatório R${numero}${fim[3]}` }
}

export interface EntradaRenomearRelatorio {
  arquivoId: string
}

/** O pedido: o arquivo do relatório (uuid de arquivos_da_versao). */
export function validarRenomearRelatorio(corpo: unknown): Validacao<EntradaRenomearRelatorio> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const arquivoId = lerTexto(corpo, 'arquivo_id', FORMATO_UUID, 'uuid')
  if (!arquivoId.ok) return arquivoId
  return { ok: true, valor: { arquivoId: arquivoId.valor } }
}
