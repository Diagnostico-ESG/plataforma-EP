/**
 * A identidade de um processo na importação: mesmo setor (sigla) e mesmo nome, sem diferença de caixa nem de espaços nas
 * pontas. É a mesma regra do banco (índice processos_nome_unico), usada na leitura, na prévia e no falso.
 */
export function chaveDoProcesso(setor: string, nome: string): string {
  return `${setor.trim().toUpperCase()}|${nome.trim().toLowerCase()}`
}
