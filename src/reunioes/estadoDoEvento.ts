import type { Reuniao } from './tipos'

/**
 * O estado da reunião como o evento do banco o guarda (private.estado_da_reuniao): as chaves são as do banco.
 * Serve ao falso, que imita o evento; a interface real lê o evento pronto.
 */
export function estadoDoEventoDaReuniao(reuniao: Reuniao): Record<string, unknown> {
  return {
    tipo: reuniao.tipo, setor_id: reuniao.setorId, setor_sigla: reuniao.setorSigla, data: reuniao.data, hora: reuniao.hora,
    local: reuniao.local, anotacoes: reuniao.anotacoes, outros_participantes: reuniao.outrosParticipantes,
    processos: reuniao.processos.map(({ id, nome }) => ({ id, nome })),
    usuarios: reuniao.usuarios.map(({ id, nome }) => ({ id, nome })),
    responsaveis: reuniao.responsaveis.map(({ id, nome }) => ({ id, nome })),
  }
}
