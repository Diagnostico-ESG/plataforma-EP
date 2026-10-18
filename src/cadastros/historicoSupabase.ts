import type { ClienteSupabase } from '../lib/supabase'
import type { EstadoDoCadastro, EventoDoCadastro, ModuloDeCadastros } from './tipos'

export type EventoDoBanco = {
  id: number; ocorrido_em: string; acao: string; entidade: string; entidade_ref: string
  detalhes: { antes: EstadoDoCadastro; depois: EstadoDoCadastro; motivo?: string | null }; autor: { nome: string } | null
}

// Cadastros, etapas (do setor e do catálogo), responsáveis do setor e os registros antigos de reunião (o recurso saiu:
// ADR 0013). A RLS de eventos já deixa passar só estas entidades para quem não é administrador; o filtro mantém o
// mesmo resultado para o administrador, que também lê os eventos de usuários (com e-mails).
const ENTIDADES_DOS_CADASTROS = [
  'setor', 'macroprocesso', 'setor_envolvido', 'andamento', 'responsavel_do_setor', 'processo', 'etapa', 'reuniao',
]

/** As colunas de um evento com o nome de quem o causou. */
export const COLUNAS_DO_EVENTO = 'id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)'

export function criarHistoricoSupabase(cliente: ClienteSupabase): Pick<ModuloDeCadastros, 'listarHistoricoDosCadastros'> {
  return { listarHistoricoDosCadastros: () => listarHistoricoDosCadastros(cliente) }
}

async function listarHistoricoDosCadastros(cliente: ClienteSupabase): Promise<EventoDoCadastro[]> {
  const { data, error } = await cliente.from('eventos')
    .select(COLUNAS_DO_EVENTO)
    .in('entidade', ENTIDADES_DOS_CADASTROS)
    .order('ocorrido_em', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Falha ao ler o histórico dos cadastros: ${error.message}`)
  return (data as unknown as EventoDoBanco[]).map(eventoDoCadastro)
}

export function eventoDoCadastro(linha: EventoDoBanco): EventoDoCadastro {
  return {
    id: linha.id, ocorridoEm: linha.ocorrido_em, autor: linha.autor?.nome ?? null, acao: linha.acao,
    entidade: linha.entidade, entidadeRef: linha.entidade_ref, antes: linha.detalhes.antes, depois: linha.detalhes.depois,
    motivo: linha.detalhes.motivo ?? undefined,
  }
}
