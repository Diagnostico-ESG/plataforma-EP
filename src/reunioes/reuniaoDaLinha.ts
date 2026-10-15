import type { Reuniao, TipoDeReuniao } from './tipos'

// A leitura com os dados juntos: setor da reunião e processos tratados (pela tabela de ligação).
export const COLUNAS_DA_REUNIAO =
  'id, tipo, data, hora, local, anotacoes, outros_participantes, setor_id, setores(sigla, ativo), reunioes_processos(processos(id, nome, situacao))'

/** Uma reunião como o banco a devolve com COLUNAS_DA_REUNIAO. */
export type LinhaDaReuniao = {
  id: string
  tipo: TipoDeReuniao
  data: string
  hora: string | null
  local: string | null
  anotacoes: string | null
  outros_participantes: string[]
  setor_id: string
  setores: { sigla: string; ativo: boolean }
  reunioes_processos: { processos: { id: string; nome: string; situacao: string } }[]
}

export function reuniaoDaLinha(linha: LinhaDaReuniao): Reuniao {
  const processos = linha.reunioes_processos
    .map(({ processos: processo }) => ({ id: processo.id, nome: processo.nome, cancelado: processo.situacao === 'cancelado' }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  return {
    id: linha.id, tipo: linha.tipo, setorId: linha.setor_id, setorSigla: linha.setores.sigla, setorAtivo: linha.setores.ativo,
    data: linha.data, hora: linha.hora?.slice(0, 5) ?? null, local: linha.local, anotacoes: linha.anotacoes,
    outrosParticipantes: linha.outros_participantes, processos,
  }
}
