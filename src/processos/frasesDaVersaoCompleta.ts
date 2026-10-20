import type { PapelDoArquivo } from '../versoes/tipos'
import type { UltimaVersao } from './tipos'

/** Os papéis que a versão completa exige, na ordem em que a frase os lista (a mesma do banco). */
const EXIGIDOS: PapelDoArquivo[] = ['bpm', 'png', 'relatorio']
const ROTULO: Record<string, string> = { bpm: '.bpm', png: '.png', relatorio: 'relatório' }

export const FRASE_SEM_VERSAO = 'O processo ainda não tem versão enviada.'

export function faltasDaVersao(papeis: PapelDoArquivo[]): PapelDoArquivo[] {
  return EXIGIDOS.filter((papel) => !papeis.includes(papel))
}

/** "A V8 está sem relatório.": o número e os papéis que faltam, como o banco os manda (nomes de papel). */
export function fraseDaVersaoIncompleta(numero: number | string, faltas: string[]): string {
  const rotulos = faltas.map((papel) => ROTULO[papel] ?? papel)
  const lista = rotulos.length > 1 ? `${rotulos.slice(0, -1).join(', ')} e ${rotulos[rotulos.length - 1]}` : rotulos[0]
  return `A V${numero} está sem ${lista}.`
}

/** O que a janela de concluir a Revisão pelo setor mostra no lugar do botão; null quando a versão está completa. */
export function fraseDoBloqueioDaConclusao(ultima: UltimaVersao | null): string | null {
  if (ultima === null) return FRASE_SEM_VERSAO
  const faltas = faltasDaVersao(ultima.papeis)
  return faltas.length === 0 ? null : fraseDaVersaoIncompleta(ultima.numero, faltas)
}
