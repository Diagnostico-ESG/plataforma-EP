import type { EstadoDoCadastro } from './tipos'

function mudou(antes: EstadoDoCadastro, depois: EstadoDoCadastro, campo: string): boolean {
  return JSON.stringify(antes?.[campo]) !== JSON.stringify(depois?.[campo])
}

/** Na alteração, só os campos que diferem; criação e exclusão (um dos lados nulo) ficam como estão. */
export function apenasOQueMudou(antes: EstadoDoCadastro, depois: EstadoDoCadastro): [EstadoDoCadastro, EstadoDoCadastro] {
  if (antes === null || depois === null) return [antes, depois]
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(depois)])].filter((campo) => mudou(antes, depois, campo))
  return [
    Object.fromEntries(campos.map((campo) => [campo, antes[campo]])),
    Object.fromEntries(campos.map((campo) => [campo, depois[campo]])),
  ]
}
