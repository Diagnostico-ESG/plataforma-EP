import type { ClienteSupabase } from '../lib/supabase'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'
import type { EtapaDoCatalogo, ListaDeProcessos, ModuloDeProcessos } from './tipos'

export function criarListaDeProcessosSupabase(cliente: ClienteSupabase): Pick<ModuloDeProcessos, 'listarProcessos'> {
  return { listarProcessos: () => listarProcessos(cliente) }
}

async function listarProcessos(cliente: ClienteSupabase): Promise<ListaDeProcessos> {
  const [linhas, etapas] = await Promise.all([lerLinhas(cliente), lerEtapasDoCatalogo(cliente)])
  const total = etapas.filter((etapa) => etapa.ativa).length
  return { etapas, processos: linhas.map((linha) => processoDaLinha(linha, total)) }
}

async function lerLinhas(cliente: ClienteSupabase): Promise<LinhaDoProcesso[]> {
  const { data, error } = await cliente.from('processos_com_andamento').select('*').order('nome')
  if (error) throw new Error(`Falha ao ler os processos: ${error.message}`)
  return data
}

async function lerEtapasDoCatalogo(cliente: ClienteSupabase): Promise<EtapaDoCatalogo[]> {
  const { data, error } = await cliente.from('etapas').select('id, codigo, nome, ordem, ativa').order('ordem')
  if (error) throw new Error(`Falha ao ler o catálogo de etapas: ${error.message}`)
  return data
}
