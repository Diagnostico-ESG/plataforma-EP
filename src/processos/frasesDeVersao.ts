/** Processo com versão não se exclui: o total vem do banco (migração versoes), e o caminho é cancelar o processo. */
export function fraseDoProcessoComVersoes(total: string | number): string {
  const versoes = Number(total) === 1 ? '1 versão enviada' : `${total} versões enviadas`
  return `Não é possível excluir: processo tem ${versoes}. Cancele o processo em vez de excluí-lo.`
}
