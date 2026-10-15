import { compararPorNome } from './ordemPorNome'
import type { ResponsavelDaReuniao, UsuarioDaReuniao } from './tipos'

// Os da reunião que a lista não traz (saíram dela) entram na escolha, para continuarem aparecendo marcados.
function comOsDaReuniao<T extends { id: string; nome: string }>(lista: T[], daReuniao: T[]): T[] {
  const faltam = daReuniao.filter((item) => !lista.some((outro) => outro.id === item.id))
  return faltam.length ? [...lista, ...faltam].sort(compararPorNome) : lista
}

/** Os usuários da escolha: os ativos e os já marcados na reunião que ficaram inativos, por nome. */
export function usuariosDaEscolha(ativos: UsuarioDaReuniao[], daReuniao: UsuarioDaReuniao[]): UsuarioDaReuniao[] {
  return comOsDaReuniao(ativos, daReuniao)
}

/** Os responsáveis da escolha: os do setor e os já marcados na reunião que saíram da lista, por nome. */
export function responsaveisDaEscolha(doSetor: ResponsavelDaReuniao[], daReuniao: ResponsavelDaReuniao[]): ResponsavelDaReuniao[] {
  return comOsDaReuniao(doSetor, daReuniao)
}
