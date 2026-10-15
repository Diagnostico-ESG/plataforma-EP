import type { ClienteSupabase } from '../lib/supabase'
import { falhaDaReuniao } from './recusasDeReunioes'
import { COLUNAS_DA_REUNIAO, type LinhaDaReuniao, reuniaoDaLinha } from './reuniaoDaLinha'
import type { DadosDaReuniao, ModuloDeReunioes, ProcessoDaReuniao, Reuniao, SetorParaReuniao } from './tipos'

export function criarReunioesSupabase(cliente: ClienteSupabase): ModuloDeReunioes {
  return {
    listarReunioes: () => listarReunioes(cliente),
    lerReuniao: (id) => lerReuniao(cliente, id),
    listarSetoresAtivos: () => listarSetoresAtivos(cliente),
    listarProcessosDoSetor: (setorId) => listarProcessosDoSetor(cliente, setorId),
    salvarReuniao: (id, dados) => salvarReuniao(cliente, id, dados),
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

async function salvarReuniao(cliente: ClienteSupabase, id: string | null, dados: DadosDaReuniao): Promise<void> {
  // O gerador de tipos do Supabase não marca parâmetro de função como anulável; o banco aceita nulo nestes (id nulo cria).
  const { error } = await cliente.rpc('salvar_reuniao', {
    p_id: id as string, p_tipo: dados.tipo, p_setor_id: dados.setorId, p_data: dados.data, p_hora: dados.hora as string,
    p_local: dados.local as string, p_anotacoes: dados.anotacoes as string, p_outros: [], p_processos: dados.processosIds,
  })
  if (error) throw falhaDaReuniao(error, dados)
}
