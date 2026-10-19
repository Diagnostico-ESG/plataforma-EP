import { type EventoDoBanco, eventoDoCadastro } from '../cadastros/historicoSupabase'
import type { ClienteSupabase } from '../lib/supabase'
import { type AndamentoLido, COLUNAS_DO_ANDAMENTO, etapaDoAndamento } from './andamentoDoBanco'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'
import type { EtapaDoProcesso, ItemDaEstrutura, ModuloDeProcessos, ProcessoLido, SituacaoDoProcesso, UltimaVersao } from './tipos'

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
  // A linha pelo id: o cliente falso dos testes responde à leitura da estrutura (a mesma view) com a mesma lista.
  const linha = data.find((uma) => uma.id === id)
  if (!linha) return null
  const [etapasDoProcesso, estrutura, ultimaVersao] = await Promise.all([
    lerAndamentosDoProcesso(cliente, id), lerEstrutura(cliente, id, linha.processo_pai_id), lerUltimaVersao(cliente, id),
  ])
  return { ...dadosDoProcesso(linha), ...estrutura, etapasDoProcesso, ultimaVersao }
}

type LinhaDaUltimaVersao = { numero: number; enviada_por: string; autor: { nome: string } | null }

// A versão não histórica de maior número: quem a enviou não pode ser o responsável da Revisão interna (o banco confere).
async function lerUltimaVersao(cliente: ClienteSupabase, id: string): Promise<UltimaVersao | null> {
  const { data, error } = await cliente.from('versoes').select('numero, enviada_por, autor:usuarios(nome)')
    .eq('processo_id', id).eq('historica', false).order('numero', { ascending: false }).limit(1)
  if (error) throw new Error(`Falha ao ler a versão mais recente do processo: ${error.message}`)
  const ultima = (data as unknown as LinhaDaUltimaVersao[])[0]
  if (!ultima) return null
  return { numero: ultima.numero, autorId: ultima.enviada_por, autorNome: ultima.autor?.nome ?? '' }
}

type LinhaDaEstrutura = Pick<LinhaDoProcesso, 'id' | 'nome' | 'processo_pai_id' | 'situacao' | 'etapa_atual_nome'>
type Estrutura = Pick<ProcessoLido, 'processoPai' | 'subprocessos'>

// O pai e os subprocessos numa leitura só, pela view que já calcula a etapa atual e a situação: as linhas que têm
// este processo como pai, mais a do pai, se houver.
async function lerEstrutura(cliente: ClienteSupabase, id: string, paiId: string | null): Promise<Estrutura> {
  const filtro = paiId ? `processo_pai_id.eq.${id},id.eq.${paiId}` : `processo_pai_id.eq.${id}`
  const { data, error } = await cliente.from('processos_com_andamento').select('id, nome, processo_pai_id, situacao, etapa_atual_nome').or(filtro).order('nome')
  if (error) throw new Error(`Falha ao ler o pai e os subprocessos do processo: ${error.message}`)
  const linhas = data as LinhaDaEstrutura[]
  const pai = linhas.find((linha) => linha.id === paiId)
  return {
    processoPai: pai ? itemDaEstrutura(pai) : null,
    subprocessos: linhas.filter((linha) => linha.processo_pai_id === id).map(itemDaEstrutura),
  }
}

function itemDaEstrutura(linha: LinhaDaEstrutura): ItemDaEstrutura {
  return {
    id: linha.id ?? '', nome: linha.nome ?? '', etapaAtual: linha.etapa_atual_nome,
    situacao: (linha.situacao ?? 'em_andamento') as SituacaoDoProcesso,
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
