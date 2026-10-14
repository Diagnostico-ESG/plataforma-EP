import type { ClienteSupabase } from '../lib/supabase'
import { processoDaLinha } from './processoDaLinha'
import type { EtapaDoCatalogo, ListaDeProcessos, ModuloDeProcessos, ProcessoDaLista } from './tipos'

export function criarListaDeProcessosSupabase(cliente: ClienteSupabase): Pick<ModuloDeProcessos, 'listarProcessos'> {
  return { listarProcessos: () => listarProcessos(cliente) }
}

async function listarProcessos(cliente: ClienteSupabase): Promise<ListaDeProcessos> {
  const [processos, etapas] = await Promise.all([lerProcessos(cliente), lerEtapasDoCatalogo(cliente)])
  return { etapas, processos }
}

async function lerProcessos(cliente: ClienteSupabase): Promise<ProcessoDaLista[]> {
  const { data, error } = await cliente.from('processos_com_andamento').select('*').order('nome')
  if (error) throw new Error(`Falha ao ler os processos: ${error.message}`)
  return data.map(processoDaLinha)
}

async function lerEtapasDoCatalogo(cliente: ClienteSupabase): Promise<EtapaDoCatalogo[]> {
  const { data, error } = await cliente.from('etapas').select('id, codigo, nome, ordem, ativa')
    .eq('nivel', 'processo').order('ordem')
  if (error) throw new Error(`Falha ao ler o catálogo de etapas: ${error.message}`)
  return data
}
