import { ROTULO_DO_TIPO } from './rotulos'
import type { TipoDeProcesso } from './tipos'

// As frases de recusa da reclassificação: o módulo real e o falso dizem exatamente o mesmo.

/** Processo com subprocessos não se exclui nem vira subprocesso: o total vem do banco. */
export function fraseDosSubprocessos(total: string | number): string {
  return `Este processo tem ${total} subprocessos; reclassifique-os ou exclua-os antes.`
}

export const FRASE_DO_PAI = 'O processo pai precisa ser do tipo Processo.'

/** A mudança de tipo que a spec não prevê, com os dois tipos recebidos. */
export function fraseDeTipoInvalido(de: string, para: string): string {
  const rotulo = (tipo: string) => ROTULO_DO_TIPO[tipo as TipoDeProcesso] ?? tipo
  return `Um item do tipo ${rotulo(de)} não pode ser reclassificado como ${rotulo(para)}.`
}
