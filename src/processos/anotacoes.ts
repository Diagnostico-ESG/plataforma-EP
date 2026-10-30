import type { AnotacoesLidas } from './tipos'

/** As regras das Anotações do processo que não dependem da tela (spec, "Anotações do processo"; ADR 0021). */
/** O processo que nunca teve anotação gravada. */
export const SEM_ANOTACOES: AnotacoesLidas = { texto: null, alteradoPor: null, alteradoEm: null }
export const LIMITE_DAS_ANOTACOES = 8000
export const PAUSA_DA_GRAVACAO_MS = 1000
const CONTAGEM_A_PARTIR_DE = 7800

const FORMATO_DO_DIA_E_DA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo',
})

/** O que vai ao banco: só espaços e quebras de linha contam como vazio (nulo); o resto segue como foi digitado. */
export function textoParaGravar(texto: string): string | null {
  return texto.trim() === '' ? null : texto
}

/** Há o que gravar: o texto digitado, como iria ao banco, difere do último texto lido ou gravado. */
export function precisaGravar(texto: string, gravado: string | null): boolean {
  return textoParaGravar(texto) !== gravado
}

/** "7.800 de 8.000" a partir de 7.800 caracteres; antes disso nada, para o bloco ficar limpo no uso comum. */
export function contagemDasAnotacoes(texto: string): string | null {
  if (texto.length < CONTAGEM_A_PARTIR_DE) return null
  return `${texto.length.toLocaleString('pt-BR')} de ${LIMITE_DAS_ANOTACOES.toLocaleString('pt-BR')}`
}

/** "Alterado por {nome} em {dd/mm}, {hh:mm}" (Brasília); sem gravação ainda, nada. */
export function linhaDaUltimaAlteracao(nome: string | null, quando: string | null): string | null {
  if (!quando) return null
  const partes = Object.fromEntries(FORMATO_DO_DIA_E_DA_HORA.formatToParts(new Date(quando)).map((parte) => [parte.type, parte.value]))
  const momento = `${partes.day}/${partes.month}, ${partes.hour}:${partes.minute}`
  return nome ? `Alterado por ${nome} em ${momento}` : `Alterado em ${momento}`
}
