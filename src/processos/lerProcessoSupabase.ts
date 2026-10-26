import { type EventoDoBanco, eventoDoCadastro } from '../cadastros/historicoSupabase'
import { diaDeBrasilia } from '../lib/datas'
import type { ClienteSupabase } from '../lib/supabase'
import type { PapelDoArquivo } from '../versoes/tipos'
import { CODIGO_DA_REVISAO_INTERNA } from './codigosDasEtapas'
import { type LinhaDoProcesso, processoDaLinha } from './processoDaLinha'
import type { EtapaDoVerso, ItemDaEstrutura, ModuloDeProcessos, ProcessoLido, SituacaoDoProcesso, UltimaVersao } from './tipos'

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
  const [etapasDoVerso, estrutura, ultimaVersao] = await Promise.all([
    lerEtapasDoVerso(cliente, id), lerEstrutura(cliente, id, linha.processo_pai_id), lerUltimaVersao(cliente, id),
  ])
  return { ...dadosDoProcesso(linha, etapasDoVerso.length), ...estrutura, etapasDoVerso, ultimaVersao }
}

type LinhaDaUltimaVersao = {
  numero: number; enviada_por: string; enviada_em: string; autor: { nome: string } | null; etapa: { codigo: string } | null
  arquivos: { papel: PapelDoArquivo }[]
}

// A versão não histórica de maior número e a anterior a ela: o aviso do revisor compara o responsável com quem enviou a
// mais recente, e a revisão "corrigida" liga a mais recente à anterior quando ela foi enviada pela Revisão interna depois
// de o processo entrar na passagem atual.
async function lerUltimaVersao(cliente: ClienteSupabase, id: string): Promise<UltimaVersao | null> {
  const { data, error } = await cliente.from('versoes')
    .select('numero, enviada_por, enviada_em, autor:usuarios(nome), etapa:etapas(codigo), arquivos:arquivos_da_versao(papel)')
    .eq('processo_id', id).eq('historica', false).order('numero', { ascending: false }).limit(2)
  if (error) throw new Error(`Falha ao ler a versão mais recente do processo: ${error.message}`)
  const [ultima, anterior] = data as unknown as LinhaDaUltimaVersao[]
  if (!ultima) return null
  return {
    numero: ultima.numero, autorId: ultima.enviada_por, autorNome: ultima.autor?.nome ?? '',
    papeis: ultima.arquivos.map((arquivo) => arquivo.papel),
    ...(anterior && { anterior: { numero: anterior.numero, autorId: anterior.enviada_por } }),
    enviadaNestaPassagem: await enviadaNestaPassagem(cliente, id, ultima),
  }
}

// Enviada pela Revisão interna depois da entrada na passagem aberta (que tem de ser a da Revisão interna).
async function enviadaNestaPassagem(cliente: ClienteSupabase, id: string, versao: LinhaDaUltimaVersao): Promise<boolean> {
  if (versao.etapa?.codigo !== CODIGO_DA_REVISAO_INTERNA) return false
  const { data, error } = await cliente.from('passagens').select('entrou_em').eq('processo_id', id).is('saiu_em', null)
  if (error) throw new Error(`Falha ao ler a passagem aberta do processo: ${error.message}`)
  const [aberta] = data as unknown as { entrou_em: string }[]
  return Boolean(aberta) && Date.parse(versao.enviada_em) >= Date.parse(aberta.entrou_em)
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

function dadosDoProcesso(linha: LinhaDoProcesso, totalDeEtapas: number) {
  return {
    ...processoDaLinha(linha, totalDeEtapas), origem: linha.origem ?? 'novo', contexto: linha.contexto,
    observacoes: linha.observacoes, motivoDaSituacao: linha.motivo_da_situacao, dataDaModelagemPiloto: linha.data_da_modelagem_piloto,
  }
}

// As etapas ativas na ordem do catálogo, cada uma com as passagens do processo (a mais recente primeiro). As datas são dias
// de Brasília. Uma etapa desativada depois de visitada fica só no histórico (spec, decisão 8).
async function lerEtapasDoVerso(cliente: ClienteSupabase, id: string): Promise<EtapaDoVerso[]> {
  const [etapas, passagens] = await Promise.all([lerEtapasAtivas(cliente), lerPassagens(cliente, id)])
  return etapas.map((etapa) => ({
    ...etapa,
    passagens: passagens.filter((passagem) => passagem.etapa_id === etapa.id).map((passagem) => ({
      entrouEm: diaDeBrasilia(passagem.entrou_em), saiuEm: passagem.saiu_em ? diaDeBrasilia(passagem.saiu_em) : null,
    })),
  }))
}

async function lerEtapasAtivas(cliente: ClienteSupabase) {
  const { data, error } = await cliente.from('etapas').select('id, codigo, nome, ordem').eq('ativa', true).order('ordem')
  if (error) throw new Error(`Falha ao ler as etapas do processo: ${error.message}`)
  return data
}

async function lerPassagens(cliente: ClienteSupabase, id: string) {
  const { data, error } = await cliente.from('passagens').select('etapa_id, entrou_em, saiu_em')
    .eq('processo_id', id).order('entrou_em', { ascending: false })
  if (error) throw new Error(`Falha ao ler as passagens do processo: ${error.message}`)
  return data
}

async function lerHistoricoDoProcesso(cliente: ClienteSupabase, id: string) {
  const { data, error } = await cliente.from('eventos')
    .select('id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)')
    // A referência do processo é o id (também a das passagens, das versões e das revisões dele).
    .in('entidade', ['processo', 'passagem', 'versao', 'revisao_interna', 'aprovacao', 'anexo']).like('entidade_ref', `${id}%`)
    .order('ocorrido_em', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Falha ao ler o histórico do processo: ${error.message}`)
  return (data as unknown as EventoDoBanco[]).map(eventoDoCadastro)
}
