/**
 * A identidade de um processo na importação: mesmo setor (sigla) e mesmo nome, sem diferença de caixa nem de espaços nas
 * pontas. É a mesma regra do banco (índice processos_nome_unico), usada na leitura, na prévia e no falso.
 */
export function chaveDoProcesso(setor: string, nome: string): string {
  return `${setor.trim().toUpperCase()}|${nome.trim().toLowerCase()}`
}

/**
 * O mesmo processo entre a pasta de arquivos, a planilha e a plataforma: além da caixa, ignora acentos e espaços repetidos,
 * porque o nome do arquivo é digitado à parte e costuma perder o acento ("Oficio") ou ganhar um espaço. Só casa; não grava
 * nome nenhum, por isso pode ser mais solta que a regra do banco.
 */
export function chaveDaPasta(setor: string, nome: string): string {
  const semAcento = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ')
  return chaveDoProcesso(semAcento(setor), semAcento(nome))
}
