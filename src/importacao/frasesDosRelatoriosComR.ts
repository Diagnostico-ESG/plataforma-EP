import { contar } from './frasesDaImportacao'

// As frases da seção "3. Relatórios com R" da aba Importação (documentos-versoes, mudança de 2026-11-13; ADR 0047).

export const PROCURANDO_RELATORIOS = 'Procurando relatórios com V no nome…'
export const NADA_A_RENOMEAR = 'Todos os relatórios numerados já estão com R.'
export const ERRO_NA_LEITURA_DOS_RELATORIOS = 'Não foi possível ler os relatórios. Confira a conexão e tente de novo.'

/** "3 relatórios ainda têm V no nome do arquivo (Relatório V2). …": a pergunta principal da seção, respondida. */
export function fraseDosRelatoriosComV(quantos: number): string {
  const tem = quantos === 1 ? 'tem' : 'têm'
  return `${contar(quantos, 'relatório', 'relatórios')} ainda ${tem} V no nome do arquivo (Relatório V2). ` +
    'Renomear troca só a letra, no Drive e na plataforma.'
}

export function fraseDosForaDoPadrao(quantos: number): string {
  const ficam = quantos === 1 ? 'fica como está' : 'ficam como estão'
  return `${contar(quantos, 'relatório', 'relatórios')} com nome fora do padrão ${ficam}.`
}

export function fraseDoAndamento(feitos: number, total: number): string {
  return `Renomeando… ${String(feitos)} de ${String(total)}.`
}

export function fraseDoFim(renomeados: number): string {
  return `${contar(renomeados, 'relatório renomeado', 'relatórios renomeados')}.`
}

export function fraseDasFalhas(falhas: number): string {
  const foram = falhas === 1 ? 'foi renomeado' : 'foram renomeados'
  return `${String(falhas)} não ${foram}. Tente de novo para continuar os que faltam.`
}
