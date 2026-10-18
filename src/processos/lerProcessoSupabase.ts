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
  const [etapasDoProcesso, etapasDoSetor, estrutura] = await Promise.all([
    lerAndamentosDoProcesso(cliente, id), lerEtapasDoSetor(cliente, data[0].setor_id ?? ''),
    lerEstrutura(cliente, id, data[0].processo_pai_id),
  ])
  return { ...dadosDoProcesso(data[0]), ...estrutura, etapasDoSetor, etapasDoProcesso }
}

type LinhaDaEstrutura = { id: string; nome: string; processo_pai_id: string | null }
type Estrutura = Pick<ProcessoLido, 'processoPai' | 'subprocessos'>

// O pai e os subprocessos numa leitura só: as linhas que têm este processo como pai, mais a do pai, se houver.
async function lerEstrutura(cliente: ClienteSupabase, id: string, paiId: string | null): Promise<Estrutura> {
  const filtro = paiId ? `processo_pai_id.eq.${id},id.eq.${paiId}` : `processo_pai_id.eq.${id}`
  const { data, error } = await cliente.from('processos').select('id, nome, processo_pai_id').or(filtro).order('nome')
  if (error) throw new Error(`Falha ao ler o pai e os subprocessos do processo: ${error.message}`)
  const linhas = data as LinhaDaEstrutura[]
  const pai = linhas.find((linha) => linha.id === paiId)
  return {
    processoPai: pai ? { id: pai.id, nome: pai.nome } : null,
    subprocessos: linhas.filter((linha) => linha.processo_pai_id === id).map(({ id: idDoFilho, nome }) => ({ id: idDoFilho, nome })),
  }
}

function dadosDoProcesso(linha: LinhaDoProcesso) {
  return {
    ...processoDaLinha(linha), origem: linha.origem ?? 'novo', contexto: linha.contexto,
    observacoes: linha.observacoes, motivoDaSituacao: linha.motivo_da_situacao, dataDaReuniao: linha.data_da_reuniao,
  }
}

type AndamentoDoProcessoLido = AndamentoLido & { responsavel: { id: string; nome: string; ativo: boolean } | null }

async function lerAndamentosDoProcesso(cliente: ClienteSupabase, id: string): Promise<EtapaDoProcesso[]> {
  const { data, error } = await cliente.from('andamentos')
    .select(`${COLUNAS_DO_ANDAMENTO}, responsavel:usuarios(id, nome, ativo)`).eq('processo_id', id)
  if (error) throw new Error(`Falha ao ler as etapas do processo: ${error.message}`)
  return (data as unknown as AndamentoDoProcessoLido[])
    .flatMap(({ responsavel, ...andamento }) =>
      etapaDoAndamento(andamento).map((etapa) => ({
        ...etapa, responsavelId: responsavel?.id ?? null, responsavelNome: responsavel?.nome ?? null,
        responsavelInativo: responsavel ? !responsavel.ativo : false,
      })))
    .sort((a, b) => a.ordem - b.ordem)
}

async function lerHistoricoDoProcesso(cliente: ClienteSupabase, id: string) {
  const { data, error } = await cliente.from('eventos')
    .select('id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)')
    // A referência do processo é o id (também a das versões dele); a das etapas, 'id:andamento' (migração andamento_do_processo).
    .in('entidade', ['processo', 'andamento', 'versao']).like('entidade_ref', `${id}%`)
    .order('ocorrido_em', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Falha ao ler o histórico do processo: ${error.message}`)
  return (data as unknown as EventoDoBanco[]).map(eventoDoCadastro)
}
