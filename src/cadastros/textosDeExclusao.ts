const FRASE_FINAL = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

function plural(n: number, singular: string, varios: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${varios}`
}

export function textoDaExclusaoDoSetor(sigla: string, macroprocessos: number): string {
  if (macroprocessos === 0) return FRASE_FINAL
  return `${sigla} sai de ${plural(macroprocessos, 'macroprocesso', 'macroprocessos')}. ${FRASE_FINAL}`
}

export function textoDaExclusaoDoMacroprocesso(setores: number): string {
  if (setores === 0) return FRASE_FINAL
  const quem = setores === 1 ? '1 setor deixa de estar envolvido nele' : `${setores} setores deixam de estar envolvidos nele`
  return `${quem}. ${FRASE_FINAL}`
}
