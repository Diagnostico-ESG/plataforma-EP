import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import type { DadosDoResponsavel, ModuloDeProcessos, ResponsavelDoSetor } from './tipos'
import { fraseDoEmailMalFormado } from './validacaoDoResponsavel'

type OperacoesDosResponsaveis = 'lerResponsaveisDoSetor' | 'criarResponsavel' | 'editarResponsavel' | 'excluirResponsavel'
type RespostaDaGravacao = { data: { id: string }[] | null; error: ErroDoBanco | null }

// As recusas chegam de fora (as de processos) para este módulo não importar quem o monta.
export function criarResponsaveisSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDosResponsaveis> {
  const tabela = () => cliente.from('responsaveis_do_setor')
  const conferir = (id: string, resposta: RespostaDaGravacao) => conferirGravacao(cliente, id, recusas, resposta)
  return {
    lerResponsaveisDoSetor: (setorId) => lerResponsaveis(cliente, setorId),
    criarResponsavel: (setorId, dados) => criarResponsavel(cliente, setorId, dados, recusas),
    editarResponsavel: async (id, dados) => conferir(id, await tabela().update(dados).eq('id', id).select('id')),
    excluirResponsavel: async (id) => conferir(id, await tabela().delete().eq('id', id).select('id')),
  }
}

async function lerResponsaveis(cliente: ClienteSupabase, setorId: string): Promise<ResponsavelDoSetor[]> {
  const { data, error } = await cliente.from('responsaveis_do_setor').select('id, nome, email, cargo')
    .eq('setor_id', setorId).order('nome')
  if (error) throw new Error(`Falha ao ler os responsáveis do setor: ${error.message}`)
  return data
}

async function criarResponsavel(
  cliente: ClienteSupabase, setorId: string, dados: DadosDoResponsavel, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.from('responsaveis_do_setor').insert({ setor_id: setorId, ...dados })
  if (error) throw falhaDoResponsavel(error, recusas)
}

// A RLS não acusa erro ao filtrar: sem linha afetada, a leitura decide entre perfil e responsável que sumiu.
async function conferirGravacao(
  cliente: ClienteSupabase, id: string, recusas: RecusasDoModulo, { data, error }: RespostaDaGravacao,
): Promise<void> {
  if (error) throw falhaDoResponsavel(error, recusas)
  if (data?.length) return
  const { data: lidos } = await cliente.from('responsaveis_do_setor').select('id').eq('id', id)
  throw porQueNadaMudou(Boolean(lidos?.length), recusas)
}

// O banco recusa o e-mail com "email_mal_formado:valor" (migração responsaveis_do_setor); o valor vai até o fim.
const PADRAO_DO_EMAIL = /\bemail_mal_formado:(.*)$/m

function falhaDoResponsavel(erro: ErroDoBanco, recusas: RecusasDoModulo): Error {
  const recusa = erro.message.match(PADRAO_DO_EMAIL)
  if (recusa) return new TravaDoBanco(fraseDoEmailMalFormado(recusa[1].trim()))
  return recusaPorPerfil(erro, recusas.semPermissao)
}
