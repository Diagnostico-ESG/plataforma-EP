import { nomeComORotuloNovo, letraDoTipo } from '../../supabase/functions/_shared/renumerar.ts'
import { textoDaFalha } from '../acesso/falhasDeGravacao'
import { lerNumeroDigitado } from './formularioDeVersao'
import { rotuloDaVersao } from './rotulos'
import type { ModuloDeVersoes, Versao } from './tipos'

/** A prévia da janela "Editar número": o rótulo novo (a letra do tipo não muda) e os nomes novos dos arquivos que levam o rótulo. */
export type PreviaDoNumero = { rotulo: string; nomes: string[] }

/** O número digitado só vale se for inteiro maior que zero e diferente do atual; senão null (o [Gravar] fica desabilitado). */
export function numeroNovoValido(texto: string, versao: Pick<Versao, 'numero'>): number | null {
  const numero = lerNumeroDigitado(texto)
  return numero === null || numero === versao.numero ? null : numero
}

/** Os nomes que os arquivos da versão terão com o número novo, pela mesma regra do banco e da função do servidor. */
export function previaDoNumero(versao: Versao, numeroNovo: number): PreviaDoNumero {
  const letra = letraDoTipo(versao)
  const antigo = `_V${versao.numero}${letra}_`
  const novo = `_V${numeroNovo}${letra}_`
  const nomes = versao.arquivos.map((arquivo) => nomeComORotuloNovo(arquivo.nome, antigo, novo)).filter((nome, posicao) => nome !== versao.arquivos[posicao].nome)
  return { rotulo: rotuloDaVersao({ ...versao, numero: numeroNovo }), nomes }
}

/** Grava o número novo; a janela espera: a frase da falha (a recusa pronta, ou o motivo) ou null quando gravou. */
export async function gravarNumeroDaVersao(
  modulo: Pick<ModuloDeVersoes, 'editarNumero'>, versao: Pick<Versao, 'id' | 'numero'>, numeroNovo: number,
): Promise<string | null> {
  try {
    await modulo.editarNumero(versao.id, versao.numero, numeroNovo)
  } catch (erro) {
    return textoDaFalha(erro)
  }
  return null
}
