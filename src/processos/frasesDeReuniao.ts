/** Processo tratado em reunião não se exclui: o total vem do banco, e o caminho é cancelar o processo. */
export function fraseDoProcessoComReunioes(total: string | number): string {
  const reunioes = Number(total) === 1 ? '1 reunião' : `${total} reuniões`
  return `Não é possível excluir: processo foi tratado em ${reunioes}. Cancele o processo em vez de excluí-lo.`
}

/** Processo tratado em reunião não troca de setor: a reunião é do setor, e o caminho é registrar um processo novo. */
export function fraseDoProcessoComReunioesNaTrocaDeSetor(total: string | number): string {
  const reunioes = Number(total) === 1 ? '1 reunião' : `${total} reuniões`
  return `Não é possível trocar o setor: processo foi tratado em ${reunioes}. Registre um processo novo no outro setor.`
}
