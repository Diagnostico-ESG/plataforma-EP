import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { Database } from '../types/database'
import { CadastroInexistente } from './cadastroInexistente'
import type { DadosDoMacroprocesso, Macroprocesso, ModuloDeCadastros } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type ErroDoBanco = { message: string; code?: string }
type AlteracaoDoMacroprocesso = Partial<DadosDoMacroprocesso> & { ativo?: boolean }
type OperacoesDeMacroprocesso = Pick<ModuloDeCadastros, 'listarMacroprocessos' | 'criarMacroprocesso'
  | 'lerMacroprocesso' | 'editarMacroprocesso' | 'desativarMacroprocesso' | 'reativarMacroprocesso'
  | 'excluirMacroprocesso'>

const COLUNAS_DO_MACROPROCESSO = 'id, codigo, nome, descricao, categoria, ativo'

export function criarMacroprocessosSupabase(cliente: ClienteSupabase): OperacoesDeMacroprocesso {
  return {
    listarMacroprocessos: () => listar(cliente),
    criarMacroprocesso: (dados) => criar(cliente, dados),
    lerMacroprocesso: (id) => ler(cliente, id),
    editarMacroprocesso: (id, dados) => alterar(cliente, id, dados),
    desativarMacroprocesso: (id) => alterar(cliente, id, { ativo: false }),
    reativarMacroprocesso: (id) => alterar(cliente, id, { ativo: true }),
    excluirMacroprocesso: (id) => excluir(cliente, id),
  }
}

async function listar(cliente: ClienteSupabase): Promise<Macroprocesso[]> {
  const { data, error } = await cliente.from('macroprocessos').select(COLUNAS_DO_MACROPROCESSO)
    .order('codigo', { nullsFirst: false }).order('nome')
  if (error) throw new Error(`Falha ao listar os macroprocessos: ${error.message}`)
  return data
}

async function ler(cliente: ClienteSupabase, id: string): Promise<Macroprocesso | null> {
  const { data, error } = await cliente.from('macroprocessos').select(COLUNAS_DO_MACROPROCESSO).eq('id', id)
  if (error) throw new Error(`Falha ao ler o macroprocesso: ${error.message}`)
  return data[0] ?? null
}

async function criar(cliente: ClienteSupabase, dados: DadosDoMacroprocesso): Promise<void> {
  const { error } = await cliente.from('macroprocessos').insert(dados)
  if (error) throw falhaDoMacroprocesso(error, dados)
}

async function alterar(cliente: ClienteSupabase, id: string, alteracao: AlteracaoDoMacroprocesso): Promise<void> {
  const { data, error } = await cliente.from('macroprocessos').update(alteracao).eq('id', id).select('id')
  if (error) throw falhaDoMacroprocesso(error, alteracao)
  if (!data.length) throw await porQueNadaMudou(cliente, id)
}

async function excluir(cliente: ClienteSupabase, id: string): Promise<void> {
  const { data, error } = await cliente.from('macroprocessos').delete().eq('id', id).select('id')
  if (error) throw falhaDoMacroprocesso(error, {})
  if (!data.length) throw await porQueNadaMudou(cliente, id)
}

// A RLS não acusa erro ao filtrar: zero linhas quer dizer que o item sumiu ou que o perfil mudou com a página aberta.
async function porQueNadaMudou(cliente: ClienteSupabase, id: string): Promise<Error> {
  if (await ler(cliente, id)) return new TravaDoBanco('Seu perfil não permite alterar os cadastros.')
  return new CadastroInexistente()
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de macroprocessos); a frase usa o que foi enviado.
function falhaDoMacroprocesso(erro: ErroDoBanco, dados: AlteracaoDoMacroprocesso): Error {
  const repetido = erro.code === '23505'
  if (repetido && erro.message.includes('macroprocessos_nome_unico')) {
    return new TravaDoBanco(`Já existe um macroprocesso com o nome ${dados.nome}.`)
  }
  if (repetido && erro.message.includes('macroprocessos_codigo_key')) {
    return new TravaDoBanco(`Já existe um macroprocesso com o código ${dados.codigo}.`)
  }
  if (erro.code === '42501') return new TravaDoBanco('Seu perfil não permite alterar os cadastros.')
  return new Error(`erro inesperado do banco (${erro.message})`)
}
