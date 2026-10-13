import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { Database } from '../types/database'
import { CadastroInexistente } from './cadastroInexistente'
import { criarMacroprocessosSupabase } from './macroprocessosSupabase'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type ErroDoBanco = { message: string; code?: string }
type AlteracaoDoSetor = Partial<DadosDoSetor> & { ativo?: boolean }

const COLUNAS_DO_SETOR = 'id, sigla, nome, observacoes, ativo'

export function criarCadastrosSupabase(cliente: ClienteSupabase): ModuloDeCadastros {
  return { ...criarSetoresSupabase(cliente), ...criarMacroprocessosSupabase(cliente) }
}

type OperacoesDeSetor = Pick<ModuloDeCadastros, 'listarSetores' | 'criarSetor' | 'lerSetor' | 'editarSetor'
  | 'desativarSetor' | 'reativarSetor' | 'excluirSetor'>

function criarSetoresSupabase(cliente: ClienteSupabase): OperacoesDeSetor {
  return {
    listarSetores: () => listarSetores(cliente),
    criarSetor: (dados) => criarSetor(cliente, dados),
    lerSetor: (id) => lerSetor(cliente, id),
    editarSetor: (id, dados) => alterarSetor(cliente, id, dados),
    desativarSetor: (id) => alterarSetor(cliente, id, { ativo: false }),
    reativarSetor: (id) => alterarSetor(cliente, id, { ativo: true }),
    excluirSetor: (id) => excluirSetor(cliente, id),
  }
}

async function listarSetores(cliente: ClienteSupabase): Promise<Setor[]> {
  const { data, error } = await cliente.from('setores').select(COLUNAS_DO_SETOR).order('sigla')
  if (error) throw new Error(`Falha ao listar os setores: ${error.message}`)
  return data
}

async function lerSetor(cliente: ClienteSupabase, id: string): Promise<Setor | null> {
  const { data, error } = await cliente.from('setores').select(COLUNAS_DO_SETOR).eq('id', id)
  if (error) throw new Error(`Falha ao ler o setor: ${error.message}`)
  return data[0] ?? null
}

async function criarSetor(cliente: ClienteSupabase, dados: DadosDoSetor): Promise<void> {
  const { error } = await cliente.from('setores').insert(dados)
  if (error) throw falhaDoSetor(error, dados)
}

async function alterarSetor(cliente: ClienteSupabase, id: string, alteracao: AlteracaoDoSetor): Promise<void> {
  const { data, error } = await cliente.from('setores').update(alteracao).eq('id', id).select('id')
  if (error) throw falhaDoSetor(error, alteracao)
  if (!data.length) throw await porQueNadaMudou(cliente, id)
}

async function excluirSetor(cliente: ClienteSupabase, id: string): Promise<void> {
  const { data, error } = await cliente.from('setores').delete().eq('id', id).select('id')
  if (error) throw falhaDoSetor(error, {})
  if (!data.length) throw await porQueNadaMudou(cliente, id)
}

// A RLS não acusa erro ao filtrar: zero linhas quer dizer que o setor sumiu ou que o perfil mudou com a página aberta.
async function porQueNadaMudou(cliente: ClienteSupabase, id: string): Promise<Error> {
  if (await lerSetor(cliente, id)) return new TravaDoBanco('Seu perfil não permite alterar os cadastros.')
  return new CadastroInexistente()
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de setores); a frase usa o que foi enviado.
function falhaDoSetor(erro: ErroDoBanco, dados: Partial<DadosDoSetor>): Error {
  const repetido = erro.code === '23505'
  if (repetido && erro.message.includes('setores_sigla_key')) {
    return new TravaDoBanco(`Já existe um setor com a sigla ${dados.sigla}.`)
  }
  if (repetido && erro.message.includes('setores_nome_unico')) {
    return new TravaDoBanco(`Já existe um setor com o nome ${dados.nome}.`)
  }
  if (erro.code === '42501') return new TravaDoBanco('Seu perfil não permite alterar os cadastros.')
  return new Error(`erro inesperado do banco (${erro.message})`)
}
