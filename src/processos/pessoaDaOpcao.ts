import type { PessoaDaOpcao } from './tipos'

/** O que a caixa de seleção precisa de uma pessoa para mostrar o Avatar: o nome puro e a foto (null na falta dela). */
export function pessoaDaOpcao({ nome, fotoUrl }: { nome: string; fotoUrl?: string | null }): PessoaDaOpcao {
  return { nome, fotoUrl: fotoUrl ?? null }
}
