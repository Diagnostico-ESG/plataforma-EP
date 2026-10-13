import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { Database } from '../types/database'
import { CadastroInexistente } from './cadastroInexistente'
import type { ModuloDeCadastros } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type ErroDoBanco = { message: string; code?: string }
type OperacoesDeVinculo = Pick<ModuloDeCadastros, 'porSetorNoMacroprocesso' | 'tirarSetorDoMacroprocesso'
  | 'mudarObservacaoDoSetorEnvolvido'>

const SEM_PERMISSAO = 'Seu perfil não permite alterar os cadastros.'

export function criarSetoresEnvolvidosSupabase(cliente: ClienteSupabase): OperacoesDeVinculo {
  return {
    porSetorNoMacroprocesso: (macroprocessoId, setorId) => por(cliente, macroprocessoId, setorId),
    tirarSetorDoMacroprocesso: (macroprocessoId, setorId) => tirar(cliente, macroprocessoId, setorId),
    mudarObservacaoDoSetorEnvolvido: (macroprocessoId, setorId, observacao) =>
      anotar(cliente, macroprocessoId, setorId, observacao),
  }
}

async function por(cliente: ClienteSupabase, macroprocessoId: string, setorId: string): Promise<void> {
  const { error } = await cliente.from('setores_envolvidos')
    .insert({ macroprocesso_id: macroprocessoId, setor_id: setorId })
  if (error) throw await falhaAoPor(cliente, error, setorId)
}

async function tirar(cliente: ClienteSupabase, macroprocessoId: string, setorId: string): Promise<void> {
  const { data, error } = await cliente.from('setores_envolvidos').delete()
    .eq('macroprocesso_id', macroprocessoId).eq('setor_id', setorId).select('setor_id')
  if (error) throw falhaDoVinculo(error)
  if (!data.length) await conferirPerfil(cliente, macroprocessoId, setorId)
}

async function anotar(
  cliente: ClienteSupabase, macroprocessoId: string, setorId: string, observacao: string | null,
): Promise<void> {
  const { data, error } = await cliente.from('setores_envolvidos').update({ observacao })
    .eq('macroprocesso_id', macroprocessoId).eq('setor_id', setorId).select('setor_id')
  if (error) throw falhaDoVinculo(error)
  if (!data.length) await conferirPerfil(cliente, macroprocessoId, setorId)
}

// A RLS não acusa erro ao filtrar: zero linhas com o vínculo ainda legível é perfil; sem vínculo, outra pessoa já o tirou.
async function conferirPerfil(cliente: ClienteSupabase, macroprocessoId: string, setorId: string): Promise<void> {
  const { data } = await cliente.from('setores_envolvidos').select('setor_id')
    .eq('macroprocesso_id', macroprocessoId).eq('setor_id', setorId)
  if (data?.length) throw new TravaDoBanco(SEM_PERMISSAO)
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de setores envolvidos).
async function falhaAoPor(cliente: ClienteSupabase, erro: ErroDoBanco, setorId: string): Promise<Error> {
  if (erro.code === '23505' && erro.message.includes('setores_envolvidos_pkey')) {
    return new TravaDoBanco(`O setor ${await siglaDoSetor(cliente, setorId)} já está neste macroprocesso.`)
  }
  if (erro.code === '23503') return new CadastroInexistente()
  return falhaDoVinculo(erro)
}

async function siglaDoSetor(cliente: ClienteSupabase, setorId: string): Promise<string> {
  const { data } = await cliente.from('setores').select('sigla').eq('id', setorId)
  return data?.[0]?.sigla ?? setorId
}

function falhaDoVinculo(erro: ErroDoBanco): Error {
  if (erro.code === '42501') return new TravaDoBanco(SEM_PERMISSAO)
  return new Error(`erro inesperado do banco (${erro.message})`)
}
