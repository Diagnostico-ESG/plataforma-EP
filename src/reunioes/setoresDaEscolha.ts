import type { Reuniao, SetorParaReuniao } from './tipos'

/**
 * Os setores da escolha do formulário: os ativos e, na edição, o setor da reunião mesmo que tenha sido
 * desativado depois (a reunião antiga continua válida), marcado como inativo e na ordem da sigla.
 */
export function setoresDaEscolha(ativos: SetorParaReuniao[], reuniao?: Reuniao): SetorParaReuniao[] {
  if (!reuniao || ativos.some((setor) => setor.id === reuniao.setorId)) return ativos
  const atual: SetorParaReuniao = { id: reuniao.setorId, sigla: reuniao.setorSigla, nome: '', inativo: true }
  return [...ativos, atual].sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'))
}
