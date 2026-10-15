import type { EstadoDoCadastro } from '../cadastros/tipos'
import { formatarData } from '../processos/caminhoDeEtapas'
import { ROTULO_DO_TIPO_DE_REUNIAO } from './rotulos'
import type { TipoDeReuniao } from './tipos'

function texto(valor: unknown): string {
  return typeof valor === 'string' && valor !== '' ? valor : '—'
}

/** O item do histórico para uma reunião: "Reunião de modelagem de 14/10/2026 — TSA". */
export function nomeDaReuniaoNoHistorico(estado: Record<string, unknown>): string {
  const tipo = ROTULO_DO_TIPO_DE_REUNIAO[estado.tipo as TipoDeReuniao]?.toLowerCase() ?? '—'
  const data = formatarData(typeof estado.data === 'string' ? estado.data : null)
  return `Reunião de ${tipo} de ${data} — ${texto(estado.setor_sigla)}`
}

/** O texto de um campo que só a reunião tem; null se o campo for de outra entidade. */
export function valorDoCampoDaReuniao(campo: string, valor: unknown): string | null {
  if (campo === 'data') return formatarData(typeof valor === 'string' ? valor : null)
  if (campo !== 'outros_participantes') return null
  return Array.isArray(valor) && valor.length > 0 ? valor.join(', ') : 'nenhum'
}

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
