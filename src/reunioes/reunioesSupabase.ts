import { porQueNadaMudou, recusaPorPerfil } from '../acesso/falhasDeGravacao'
import { COLUNAS_DO_EVENTO, type EventoDoBanco, eventoDoCadastro } from '../cadastros/historicoSupabase'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ClienteSupabase } from '../lib/supabase'
import { RECUSAS_DAS_REUNIOES, SEM_PERMISSAO_DAS_REUNIOES, falhaDaReuniao } from './recusasDeReunioes'
import { COLUNAS_DA_REUNIAO, type LinhaDaReuniao, reuniaoDaLinha } from './reuniaoDaLinha'
import type {
  DadosDaReuniao, ModuloDeReunioes, ProcessoDaReuniao, ResponsavelDaReuniao, Reuniao, SetorParaReuniao, UsuarioDaReuniao,
} from './tipos'

export function criarReunioesSupabase(cliente: ClienteSupabase): ModuloDeReunioes {
  return {
    listarReunioes: () => listarReunioes(cliente),
    lerReuniao: (id) => lerReuniao(cliente, id),
    listarSetoresAtivos: () => listarSetoresAtivos(cliente),
    listarProcessosDoSetor: (setorId) => listarProcessosDoSetor(cliente, setorId),
    listarUsuariosAtivos: () => listarUsuariosAtivos(cliente),
    listarResponsaveisDoSetor: (setorId) => listarResponsaveisDoSetor(cliente, setorId),
    salvarReuniao: (id, dados) => salvarReuniao(cliente, id, dados),
    excluirReuniao: (id) => excluirReuniao(cliente, id),
    lerHistoricoDaReuniao: (id) => lerHistoricoDaReuniao(cliente, id),
  }
}

// O tipo do Supabase não acompanha a forma da leitura com ligações; LinhaDaReuniao a descreve.
async function listarReunioes(cliente: ClienteSupabase): Promise<Reuniao[]> {
  const { data, error } = await cliente.from('reunioes').select(COLUNAS_DA_REUNIAO)
  if (error) throw new Error(`Falha ao ler as reuniões: ${error.message}`)
  return (data as unknown as LinhaDaReuniao[]).map(reuniaoDaLinha)
}

async function lerReuniao(cliente: ClienteSupabase, id: string): Promise<Reuniao | null> {
  const { data, error } = await cliente.from('reunioes').select(COLUNAS_DA_REUNIAO).eq('id', id)
  if (error) throw new Error(`Falha ao ler a reunião ${id}: ${error.message}`)
  const linhas = data as unknown as LinhaDaReuniao[]
  return linhas.length ? reuniaoDaLinha(linhas[0]) : null
}

async function listarSetoresAtivos(cliente: ClienteSupabase): Promise<SetorParaReuniao[]> {
  const { data, error } = await cliente.from('setores').select('id, sigla, nome').eq('ativo', true).order('sigla')
  if (error) throw new Error(`Falha ao ler os setores: ${error.message}`)
  return data
}

async function listarProcessosDoSetor(cliente: ClienteSupabase, setorId: string): Promise<ProcessoDaReuniao[]> {
  const { data, error } = await cliente.from('processos').select('id, nome, situacao').eq('setor_id', setorId).order('nome')
  if (error) throw new Error(`Falha ao ler os processos do setor ${setorId}: ${error.message}`)
  return data.map(({ id, nome, situacao }) => ({ id, nome, cancelado: situacao === 'cancelado' }))
}

async function listarUsuariosAtivos(cliente: ClienteSupabase): Promise<UsuarioDaReuniao[]> {
  const { data, error } = await cliente.from('usuarios').select('id, nome, ativo').eq('ativo', true).order('nome')
  if (error) throw new Error(`Falha ao ler os usuários: ${error.message}`)
  return data
}

async function listarResponsaveisDoSetor(cliente: ClienteSupabase, setorId: string): Promise<ResponsavelDaReuniao[]> {
  const { data, error } = await cliente.from('responsaveis_do_setor').select('id, nome').eq('setor_id', setorId).order('nome')
  if (error) throw new Error(`Falha ao ler os responsáveis do setor ${setorId}: ${error.message}`)
  return data
}

async function salvarReuniao(cliente: ClienteSupabase, id: string | null, dados: DadosDaReuniao): Promise<void> {
  // O gerador de tipos do Supabase não marca parâmetro de função como anulável; o banco aceita nulo nestes (id nulo cria).
  const { error } = await cliente.rpc('salvar_reuniao', {
    p_id: id as string, p_tipo: dados.tipo, p_setor_id: dados.setorId, p_data: dados.data, p_hora: dados.hora as string,
    p_local: dados.local as string, p_anotacoes: dados.anotacoes as string, p_outros: dados.outrosParticipantes,
    p_processos: dados.processosIds, p_usuarios: dados.usuariosIds, p_responsaveis: dados.responsaveisIds,
  })
  if (error) throw falhaDaReuniao(error, dados)
}

// A RLS não acusa erro ao filtrar: sem linha afetada, a leitura decide entre perfil e reunião que sumiu.
async function excluirReuniao(cliente: ClienteSupabase, id: string): Promise<void> {
  const { data, error } = await cliente.from('reunioes').delete().eq('id', id).select('id')
  if (error) throw recusaPorPerfil(error, SEM_PERMISSAO_DAS_REUNIOES)
  if (data.length) return
  const { data: lidas } = await cliente.from('reunioes').select('id').eq('id', id)
  throw porQueNadaMudou(Boolean(lidas?.length), RECUSAS_DAS_REUNIOES)
}

async function lerHistoricoDaReuniao(cliente: ClienteSupabase, id: string): Promise<EventoDoCadastro[]> {
  const { data, error } = await cliente.from('eventos').select(COLUNAS_DO_EVENTO)
    .eq('entidade', 'reuniao').eq('entidade_ref', id)
    .order('ocorrido_em', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Falha ao ler o histórico da reunião ${id}: ${error.message}`)
  return (data as unknown as EventoDoBanco[]).map(eventoDoCadastro)
}
