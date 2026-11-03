import type { ClienteSupabase } from '../lib/supabase'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'
import type { EtapaDoCatalogo, ListaDeProcessos, ModuloDeProcessos, SetorDoQuadro } from './tipos'

export function criarListaDeProcessosSupabase(cliente: ClienteSupabase): Pick<ModuloDeProcessos, 'listarProcessos'> {
  return { listarProcessos: () => listarProcessos(cliente) }
}

async function listarProcessos(cliente: ClienteSupabase): Promise<ListaDeProcessos> {
  const [linhas, etapas, setores] = await Promise.all([lerLinhas(cliente), lerEtapasDoCatalogo(cliente), lerSetores(cliente)])
  const total = etapas.filter((etapa) => etapa.ativa).length
  return { etapas, processos: linhas.map((linha) => processoDaLinha(linha, total)), setores }
}

// O Quadro por setor mostra também os setores sem processo, que a view dos processos não traz.
async function lerSetores(cliente: ClienteSupabase): Promise<SetorDoQuadro[]> {
  const { data, error } = await cliente.from('setores').select('id, sigla, nome, ativo').order('sigla')
  if (error) throw new Error(`Falha ao ler os setores: ${error.message}`)
  return data
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
