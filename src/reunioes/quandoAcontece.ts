import type { Reuniao } from './tipos'

/** O dia de hoje no relógio de quem usa (AAAA-MM-DD), que é como a data da reunião é guardada. */
export function hojeLocal(agora: Date = new Date()): string {
  const dois = (numero: number) => String(numero).padStart(2, '0')
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`
}

/** Reunião com data depois de hoje é próxima; a de hoje e as anteriores são realizadas. */
export function ehProxima(data: string, hoje: string): boolean {
  return data > hoje
}

/** Sem hora, a reunião fica depois das que têm hora no mesmo dia. */
function porDiaEHora(a: Reuniao, b: Reuniao): number {
  return a.data.localeCompare(b.data) || (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99')
}

/** As próximas no topo (da mais próxima à mais distante), depois as realizadas (da mais recente à mais antiga). */
export function ordenarReunioes(reunioes: Reuniao[], hoje: string): Reuniao[] {
  const proximas = reunioes.filter((r) => ehProxima(r.data, hoje)).sort(porDiaEHora)
  const realizadas = reunioes.filter((r) => !ehProxima(r.data, hoje)).sort((a, b) => porDiaEHora(b, a))
  return [...proximas, ...realizadas]
}

export function semAnotacoes(reuniao: Reuniao, hoje: string): boolean {
  return !ehProxima(reuniao.data, hoje) && reuniao.anotacoes === null
}
