import { compararPorNome } from './ordemPorNome'
import type { ProcessoDaReuniao, ResponsavelDaReuniao, Reuniao, TipoDeReuniao, UsuarioDaReuniao } from './tipos'

// A leitura com os dados juntos: setor da reunião, processos tratados e participantes (pelas tabelas de ligação).
export const COLUNAS_DA_REUNIAO =
  'id, tipo, data, hora, local, anotacoes, outros_participantes, setor_id, setores(sigla, ativo), reunioes_processos(processos(id, nome, situacao)), reunioes_usuarios(usuarios(id, nome, ativo)), reunioes_responsaveis(responsaveis_do_setor(id, nome))'

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
  reunioes_usuarios: { usuarios: UsuarioDaReuniao }[]
  reunioes_responsaveis: { responsaveis_do_setor: ResponsavelDaReuniao }[]
}

function processosDaLinha(linha: LinhaDaReuniao): ProcessoDaReuniao[] {
  return linha.reunioes_processos
    .map(({ processos: processo }) => ({ id: processo.id, nome: processo.nome, cancelado: processo.situacao === 'cancelado' }))
    .sort(compararPorNome)
}

export function reuniaoDaLinha(linha: LinhaDaReuniao): Reuniao {
  return {
    id: linha.id, tipo: linha.tipo, setorId: linha.setor_id, setorSigla: linha.setores.sigla, setorAtivo: linha.setores.ativo,
    data: linha.data, hora: linha.hora?.slice(0, 5) ?? null, local: linha.local, anotacoes: linha.anotacoes,
    outrosParticipantes: linha.outros_participantes, processos: processosDaLinha(linha),
    usuarios: linha.reunioes_usuarios.map(({ usuarios }) => usuarios).sort(compararPorNome),
    responsaveis: linha.reunioes_responsaveis.map(({ responsaveis_do_setor: responsavel }) => responsavel).sort(compararPorNome),
  }
}
