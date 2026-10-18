// Frases das recusas do catálogo de etapas, as mesmas no módulo real e no falso.

export function fraseDaEtapaUsada(nome: string): string {
  return `A etapa ${nome} já foi usada; desative-a em vez de excluir.`
}

export function fraseDeNomeRepetido(nome: string): string {
  return `Já existe uma etapa com o nome ${nome}.`
}

export function fraseDeCodigoRepetido(codigo: string): string {
  return `Já existe uma etapa com o código ${codigo}.`
}
