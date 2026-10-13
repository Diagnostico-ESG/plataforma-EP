import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { Database } from '../types/database'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type ErroDoBanco = { message: string; code?: string }

export function criarCadastrosSupabase(cliente: ClienteSupabase): ModuloDeCadastros {
  return {
    listarSetores: () => listarSetores(cliente),
    criarSetor: (dados) => criarSetor(cliente, dados),
  }
}

async function listarSetores(cliente: ClienteSupabase): Promise<Setor[]> {
  const { data, error } = await cliente.from('setores').select('id, sigla, nome, observacoes, ativo').order('sigla')
  if (error) throw new Error(`Falha ao listar os setores: ${error.message}`)
  return data
}

async function criarSetor(cliente: ClienteSupabase, dados: DadosDoSetor): Promise<void> {
  const { error } = await cliente.from('setores').insert(dados)
  if (error) throw falhaDoSetor(error, dados)
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de setores); a frase usa o que foi enviado.
function falhaDoSetor(erro: ErroDoBanco, dados: DadosDoSetor): Error {
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
