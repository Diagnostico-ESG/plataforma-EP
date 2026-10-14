import { type EventoDoBanco, eventoDoCadastro } from '../cadastros/historicoSupabase'
import type { ClienteSupabase } from '../lib/supabase'
import {
  type AndamentoLido, COLUNAS_DO_ANDAMENTO, etapaDoAndamento, lerEtapasDoSetor,
} from './etapasDoSetorSupabase'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'
import type { EtapaDoProcesso, ModuloDeProcessos, ProcessoLido } from './tipos'

type OperacoesDeLeitura = Pick<ModuloDeProcessos, 'lerProcesso' | 'lerHistoricoDoProcesso'>

export function criarLeituraDeProcessoSupabase(cliente: ClienteSupabase): OperacoesDeLeitura {
  return {
    lerProcesso: (id) => lerProcesso(cliente, id),
    lerHistoricoDoProcesso: (id) => lerHistoricoDoProcesso(cliente, id),
  }
}

async function lerProcesso(cliente: ClienteSupabase, id: string): Promise<ProcessoLido | null> {
  const { data, error } = await cliente.from('processos_com_andamento').select('*').eq('id', id)
  if (error) throw new Error(`Falha ao ler o processo: ${error.message}`)
  if (!data[0]) return null
  const [etapasDoProcesso, etapasDoSetor] = await Promise.all([
    lerAndamentosDoProcesso(cliente, id), lerEtapasDoSetor(cliente, data[0].setor_id ?? ''),
  ])
  return { ...dadosDoProcesso(data[0]), etapasDoSetor, etapasDoProcesso }
}

function dadosDoProcesso(linha: LinhaDoProcesso) {
  return {
    ...processoDaLinha(linha), origem: linha.origem ?? 'novo', contexto: linha.contexto,
    observacoes: linha.observacoes, motivoDaSituacao: linha.motivo_da_situacao,
  }
}

type AndamentoDoProcessoLido = AndamentoLido & { responsavel: { nome: string } | null }

async function lerAndamentosDoProcesso(cliente: ClienteSupabase, id: string): Promise<EtapaDoProcesso[]> {
  const { data, error } = await cliente.from('andamentos')
    .select(`${COLUNAS_DO_ANDAMENTO}, responsavel:usuarios(nome)`).eq('processo_id', id)
  if (error) throw new Error(`Falha ao ler as etapas do processo: ${error.message}`)
  return (data as unknown as AndamentoDoProcessoLido[])
    .flatMap(({ responsavel, ...andamento }) =>
      etapaDoAndamento(andamento).map((etapa) => ({ ...etapa, responsavelNome: responsavel?.nome ?? null })))
    .sort((a, b) => a.ordem - b.ordem)
}

async function lerHistoricoDoProcesso(cliente: ClienteSupabase, id: string) {
  const { data, error } = await cliente.from('eventos')
    .select('id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)')
    .eq('entidade', 'processo').eq('entidade_ref', id)
    .order('ocorrido_em', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Falha ao ler o histórico do processo: ${error.message}`)
  return (data as unknown as EventoDoBanco[]).map(eventoDoCadastro)
}
