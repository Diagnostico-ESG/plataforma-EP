// Decisão da ação renumerar da função arquivos-no-drive (travas-em-avisos, ticket 03; ADR 0028). Arquivo puro, sem Deno nem npm:,
// testado no Vitest. Quem pode e a situação do processo são as regras de sempre (decisao.ts); aqui, qual entrada vale, o que o
// banco diria do número (conferido antes de tocar o Drive) e quais arquivos mudam de nome. A regra do nome é a mesma da função
// private.nome_com_o_rotulo_novo do banco: o primeiro "_V7_" (ou "_V7F_", "_V7P_") do nome padrão vira o rótulo novo.
import { FORMATO_UUID, eCorpo, falhar, lerInteiroPositivo, lerTexto, tipoDe, type Validacao } from './decisao.ts'
import type { RecusaDoBanco } from './registro.ts'

export interface EntradaRenumerar {
  versaoId: string
  /** O número que a tela viu: se já mudou, nada é renomeado nem gravado. */
  numeroEsperado: number
  numeroNovo: number
}

/** O pedido: a versão, o número que a tela viu e o número novo (inteiro maior que zero, diferente do visto). */
export function validarRenumerar(corpo: unknown): Validacao<EntradaRenumerar> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const versaoId = lerTexto(corpo, 'versao_id', FORMATO_UUID, 'uuid')
  if (!versaoId.ok) return versaoId
  const numeroEsperado = lerInteiroPositivo(corpo, 'numero_esperado')
  if (!numeroEsperado.ok) return numeroEsperado
  const numeroNovo = lerInteiroPositivo(corpo, 'numero_novo')
  if (!numeroNovo.ok) return numeroNovo
  if (numeroNovo.valor === numeroEsperado.valor) {
    return falhar('entrada_invalida', `campo numero_novo: esperado número diferente de ${numeroEsperado.valor}, recebido ${numeroNovo.valor}`)
  }
  return { ok: true, valor: { versaoId: versaoId.valor, numeroEsperado: numeroEsperado.valor, numeroNovo: numeroNovo.valor } }
}

export interface VersaoDoProcesso {
  numero: number
  historica: boolean
  piloto: boolean
}

/** A letra do tipo, que a edição não muda: F na histórica, P na piloto, nada na em sequência. */
export function letraDoTipo(versao: Pick<VersaoDoProcesso, 'historica' | 'piloto'>): string {
  if (versao.historica) return 'F'
  return versao.piloto ? 'P' : ''
}

export function rotuloDaVersao(versao: VersaoDoProcesso): string {
  return `V${versao.numero}${letraDoTipo(versao)}`
}

// Recusas no formato do banco ("motivo:valor"), que a tela já traduz por código (src/versoes/recusasDeVersoes.ts).
export const recusaNumeroJaUsado = (rotulo: string): RecusaDoBanco => ({ codigo: 'numero_ja_usado', mensagem: rotulo })
export const recusaNumeroAlterado = (atual: number): RecusaDoBanco => ({ codigo: 'numero_da_versao_alterado', mensagem: String(atual) })
export const recusaDeRenomeacaoNoDrive = (rotuloAtual: string): RecusaDoBanco =>
  ({ codigo: 'renomeacao_no_drive_falhou', mensagem: rotuloAtual })
/** Os nomes não voltaram todos ao que eram: repetir a edição leva todos ao número pedido. */
export const RECUSA_DE_RENOMEACAO_INCOMPLETA: RecusaDoBanco =
  { codigo: 'renomeacao_incompleta', mensagem: 'Repita a edição para corrigir os nomes no Drive.' }

/** O que o banco diria do número, conferido antes de tocar o Drive: o número que a tela viu mudou, ou outra versão já o usa. */
export function conferirNumeroDaVersao(
  versao: VersaoDoProcesso, entrada: Pick<EntradaRenumerar, 'numeroEsperado' | 'numeroNovo'>, doProcesso: VersaoDoProcesso[],
): RecusaDoBanco | null {
  if (entrada.numeroEsperado !== versao.numero) return recusaNumeroAlterado(versao.numero)
  const repetida = doProcesso.find((outra) => outra.numero === entrada.numeroNovo)
  return repetida ? recusaNumeroJaUsado(rotuloDaVersao(repetida)) : null
}

/** O nome com o primeiro rótulo antigo trocado pelo novo; nome sem o rótulo fica como está. */
export function nomeComORotuloNovo(nome: string, rotuloAntigo: string, rotuloNovo: string): string {
  const posicao = nome.indexOf(rotuloAntigo)
  if (posicao === -1) return nome
  return nome.slice(0, posicao) + rotuloNovo + nome.slice(posicao + rotuloAntigo.length)
}

export interface ArquivoParaRenomear {
  driveId: string
  nomeAntigo: string
  nomeNovo: string
}

/** Os arquivos da versão (fluxogramas, relatórios ligados a ela e o .pdf atual da aprovação) cujo nome muda; os demais ficam fora. */
export function arquivosParaRenomear(
  arquivos: { drive_id: string; nome: string }[], versao: VersaoDoProcesso, numeroNovo: number,
): ArquivoParaRenomear[] {
  const letra = letraDoTipo(versao)
  const antigo = `_V${versao.numero}${letra}_`
  const novo = `_V${numeroNovo}${letra}_`
  return arquivos
    .map((arquivo) => ({ driveId: arquivo.drive_id, nomeAntigo: arquivo.nome, nomeNovo: nomeComORotuloNovo(arquivo.nome, antigo, novo) }))
    .filter((arquivo) => arquivo.nomeNovo !== arquivo.nomeAntigo)
}
