import type { FiltrosDasReunioes } from './enderecoDasReunioes'
import type { Reuniao } from './tipos'

export function temFiltro(filtros: FiltrosDasReunioes): boolean {
  return Object.values(filtros).some((valor) => valor !== null)
}

// Uma conferência por filtro; o filtro vazio deixa passar. O período é inclusivo nas duas pontas.
const CONFERENCIAS: Record<keyof FiltrosDasReunioes, (reuniao: Reuniao, valor: string) => boolean> = {
  setor: (reuniao, valor) => reuniao.setorId === valor,
  tipo: (reuniao, valor) => reuniao.tipo === valor,
  de: (reuniao, valor) => reuniao.data >= valor,
  ate: (reuniao, valor) => reuniao.data <= valor,
}

export function filtrarReunioes(reunioes: Reuniao[], filtros: FiltrosDasReunioes): Reuniao[] {
  const nomes = Object.keys(CONFERENCIAS) as (keyof FiltrosDasReunioes)[]
  return reunioes.filter((reuniao) =>
    nomes.every((nome) => filtros[nome] === null || CONFERENCIAS[nome](reuniao, filtros[nome])))
}
