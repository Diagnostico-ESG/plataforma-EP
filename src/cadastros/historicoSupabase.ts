import type { ClienteSupabase } from '../lib/supabase'
import type { EstadoDoCadastro, EventoDoCadastro, ModuloDeCadastros } from './tipos'

type EventoDoBanco = {
  id: number; ocorrido_em: string; acao: string; entidade: string; entidade_ref: string
  detalhes: { antes: EstadoDoCadastro; depois: EstadoDoCadastro }; autor: { nome: string } | null
}

// A RLS de eventos já deixa passar só estas entidades para quem não é administrador; o filtro mantém o mesmo
// resultado para o administrador, que também lê os eventos de usuários (com e-mails).
const ENTIDADES_DOS_CADASTROS = ['setor', 'macroprocesso', 'setor_envolvido']

export function criarHistoricoSupabase(cliente: ClienteSupabase): Pick<ModuloDeCadastros, 'listarHistoricoDosCadastros'> {
  return { listarHistoricoDosCadastros: () => listarHistoricoDosCadastros(cliente) }
}

async function listarHistoricoDosCadastros(cliente: ClienteSupabase): Promise<EventoDoCadastro[]> {
  const { data, error } = await cliente.from('eventos')
    .select('id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)')
    .in('entidade', ENTIDADES_DOS_CADASTROS)
    .order('ocorrido_em', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Falha ao ler o histórico dos cadastros: ${error.message}`)
  return (data as unknown as EventoDoBanco[]).map(eventoDoCadastro)
}

function eventoDoCadastro(linha: EventoDoBanco): EventoDoCadastro {
  return {
    id: linha.id, ocorridoEm: linha.ocorrido_em, autor: linha.autor?.nome ?? null, acao: linha.acao,
    entidade: linha.entidade, entidadeRef: linha.entidade_ref, antes: linha.detalhes.antes, depois: linha.detalhes.depois,
  }
}
