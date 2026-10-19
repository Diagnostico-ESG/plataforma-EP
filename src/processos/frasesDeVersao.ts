/** Processo com versão não se exclui: o total vem do banco (migração versoes), e o caminho é cancelar o processo. */
export function fraseDoProcessoComVersoes(total: string | number): string {
  const versoes = Number(total) === 1 ? '1 versão enviada' : `${total} versões enviadas`
  return `Não é possível excluir: processo tem ${versoes}. Cancele o processo em vez de excluí-lo.`
}

/** Trava do autor (migração trava_do_autor_e_voltar_com_responsavel): o banco manda "numero:nome", o nome pode ter dois-pontos. */
export function fraseDoAutorDaVersao(valor: string): string {
  const separador = valor.indexOf(':')
  const numero = valor.slice(0, separador)
  const nome = valor.slice(separador + 1)
  return `${nome} enviou a versão V${numero} e não pode ser responsável pela Revisão interna.`
}
