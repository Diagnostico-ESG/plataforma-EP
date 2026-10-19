import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { formatarData } from './caminhoDeEtapas'
import { fraseDaEtapaProtegida, fraseDaEtapaUsada } from './frasesDoCatalogo'
import { FRASE_SEM_VERSAO, fraseDaVersaoIncompleta } from './frasesDaVersaoCompleta'
import { FRASE_DO_PAI, fraseDeTipoInvalido, fraseDosSubprocessos } from './frasesDeReclassificacao'
import { fraseDoAutorDaVersao, fraseDoProcessoComVersoes } from './frasesDeVersao'
import {
  FRASE_DA_CORRIGIDA_SEM_ANTERIOR, FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR, FRASE_DA_REVISAO_FORA_DA_ETAPA,
  FRASE_DO_ESCOPO_OBRIGATORIO, FRASE_DO_ESCOPO_SO_NA_CORRIGIDA, fraseDaVersaoSemRevisao, fraseDoProcessoComRevisoes,
  fraseDoRevisorQueEAutor,
} from '../revisoes/frasesDeRevisao'
import {
  FRASE_DA_APROVACAO_FORA_DA_ETAPA, FRASE_DA_APROVACAO_NA_VOLTA, FRASE_DO_LINK_INVALIDO, FRASE_DO_PROCESSO_COM_APROVACAO,
  FRASE_DO_PROCESSO_JA_APROVADO, fraseDaAprovacaoAntesDaRevisao, fraseDaDataNoFuturo, fraseDaVersaoAprovada, fraseDaVersaoSemAprovacao,
} from '../revisoes/frasesDeAprovacao'
import { fraseDeSituacaoInvalida, fraseDoProcessoParado } from './frasesDeSituacao'
import type { ModuloDeProcessos, UsuarioResponsavel } from './tipos'

type OperacoesDoAndamento = 'iniciarEtapa' | 'concluirEtapa' | 'dispensarEtapa' | 'registrarRealizadaAnteriormente'
  | 'voltarParaEtapa' | 'corrigirDatasDaEtapa' | 'mudarResponsavelDaEtapa' | 'listarResponsaveisPossiveis'
type MudancaDoAndamento = Database['public']['Tables']['andamentos']['Update']

// As recusas chegam de fora (as de processos) para este módulo não importar quem o monta.
export function criarAndamentosSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDoAndamento> {
  const mudar = (id: string, mudanca: MudancaDoAndamento) => mudarAndamento(cliente, id, mudanca, recusas)
  return {
    iniciarEtapa: (id) => mudar(id, { status: 'em_andamento' }),
    concluirEtapa: (id, responsavelId) => avancar(cliente, id, 'concluir', null, responsavelId, recusas),
    dispensarEtapa: (id, nota, responsavelId) => avancar(cliente, id, 'dispensar', nota, responsavelId, recusas),
    registrarRealizadaAnteriormente: (id, nota, responsavelId) =>
      avancar(cliente, id, 'realizada_anteriormente', nota, responsavelId, recusas),
    corrigirDatasDaEtapa: (id, datas) => mudar(id, { iniciada_em: datas.iniciadaEm, resolvida_em: datas.resolvidaEm }),
    mudarResponsavelDaEtapa: (id, usuarioId) => mudar(id, { responsavel_id: usuarioId }),
    voltarParaEtapa: (id, motivo, responsavelId) => voltarParaEtapa(cliente, id, motivo, responsavelId, recusas),
    listarResponsaveisPossiveis: () => listarResponsaveisPossiveis(cliente),
  }
}

async function mudarAndamento(
  cliente: ClienteSupabase, id: string, mudanca: MudancaDoAndamento, recusas: RecusasDoModulo,
): Promise<void> {
  const { data, error } = await cliente.from('andamentos').update(mudanca).eq('id', id).select('id')
  if (error) throw falhaDoAndamento(error, recusas)
  if (!data.length) throw porQueNadaMudou(await andamentoExiste(cliente, id), recusas)
}

// A função do banco resolve a etapa e inicia a próxima numa transação só. O supabase-js manda null como null;
// o tipo gerado não o admite nos parâmetros, como em reclassificar_processo.
async function avancar(
  cliente: ClienteSupabase, id: string, acao: 'concluir' | 'dispensar' | 'realizada_anteriormente',
  nota: string | null, responsavelId: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('avancar_etapa', {
    p_andamento: id, p_acao: acao, p_nota: nota as string, p_responsavel: responsavelId as string,
  })
  if (error) throw falhaDoAndamento(error, recusas)
}

async function andamentoExiste(cliente: ClienteSupabase, id: string): Promise<boolean> {
  const { data } = await cliente.from('andamentos').select('id').eq('id', id)
  return Boolean(data?.length)
}

// Como em avancar: p_responsavel vai como null quando não há (o supabase-js manda null; o tipo gerado não o admite).
async function voltarParaEtapa(
  cliente: ClienteSupabase, id: string, motivo: string, responsavelId: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('voltar_a_etapa', { p_andamento: id, p_motivo: motivo, p_responsavel: responsavelId as string })
  if (error) throw falhaDoAndamento(error, recusas)
}

async function listarResponsaveisPossiveis(cliente: ClienteSupabase): Promise<UsuarioResponsavel[]> {
  const { data, error } = await cliente.from('usuarios').select('id, nome')
    .eq('ativo', true).in('perfil', ['administrador', 'integrante_ep']).order('nome')
  if (error) throw new Error(`Falha ao ler os usuários que podem ser responsáveis: ${error.message}`)
  return data
}

// O banco recusa com "motivo:valor" (migrações etapas_do_setor, andamento_do_processo, voltar_datas_responsavel,
// situacao_do_processo, subprocessos_e_reclassificacao, catalogo_de_etapas, versoes e revisao_interna).
// O motivo "motivo_obrigatorio" não tem valor; o valor vai até o fim da mensagem.
const PADRAO_DA_RECUSA = new RegExp(
  '\\b(anterior_nao_resolvida|etapa_obrigatoria|ja_ha_etapa_em_andamento|etapa_nao_resolvida'
  + '|motivo_obrigatorio|nota_obrigatoria|data_no_futuro|resolvida_antes_do_inicio|responsavel_invalido|processo_parado'
  + '|situacao_invalida|processo_com_subprocessos|pai_nao_e_processo|tipo_invalido'
  + '|etapa_usada|etapa_protegida'
  + '|processo_com_versoes|autor_da_versao|sem_versao|versao_incompleta'
  + '|revisor_e_autor|corrigida_sem_versao_do_revisor|corrigida_sem_versao_anterior|escopo_obrigatorio'
  + '|escopo_so_na_corrigida|revisao_fora_da_etapa|sem_revisao_da_versao|processo_com_revisoes'
  + '|aprovacao_fora_da_etapa|processo_ja_aprovado|link_invalido|aprovacao_antes_da_revisao|sem_aprovacao'
  + '|aprovacao_so_se_desfaz_na_volta|versao_aprovada|processo_com_aprovacao)(?::(.*))?$', 'm')

const FRASE_DA_RECUSA: Record<string, (valor: string) => string> = {
  anterior_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_obrigatoria: (etapa) => `A etapa ${etapa} é obrigatória e não pode ser dispensada.`,
  ja_ha_etapa_em_andamento: (etapa) => `Já há uma etapa em andamento neste processo: ${etapa}.`,
  motivo_obrigatorio: () => 'O motivo é obrigatório.',
  nota_obrigatoria: () => 'A nota é obrigatória.',
  data_no_futuro: fraseDaDataNoFuturo,
  resolvida_antes_do_inicio: (datas) => {
    const [conclusao, inicio] = datas.split(':')
    return `A conclusão (${formatarData(conclusao)}) não pode ser antes do início (${formatarData(inicio)}).`
  },
  responsavel_invalido: (nome) =>
    `${nome} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.`,
  processo_parado: fraseDoProcessoParado,
  situacao_invalida: (situacoes) => {
    const [de, para] = situacoes.split(':')
    return fraseDeSituacaoInvalida(de, para)
  },
  processo_com_subprocessos: fraseDosSubprocessos,
  pai_nao_e_processo: () => FRASE_DO_PAI,
  tipo_invalido: (tipos) => {
    const [de, para] = tipos.split(':')
    return fraseDeTipoInvalido(de, para)
  },
  etapa_usada: fraseDaEtapaUsada,
  processo_com_versoes: fraseDoProcessoComVersoes,
  autor_da_versao: fraseDoAutorDaVersao,
  etapa_protegida: fraseDaEtapaProtegida,
  sem_versao: () => FRASE_SEM_VERSAO,
  revisor_e_autor: fraseDoRevisorQueEAutor,
  corrigida_sem_versao_do_revisor: () => FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR,
  corrigida_sem_versao_anterior: () => FRASE_DA_CORRIGIDA_SEM_ANTERIOR,
  escopo_obrigatorio: () => FRASE_DO_ESCOPO_OBRIGATORIO,
  escopo_so_na_corrigida: () => FRASE_DO_ESCOPO_SO_NA_CORRIGIDA,
  revisao_fora_da_etapa: () => FRASE_DA_REVISAO_FORA_DA_ETAPA,
  sem_revisao_da_versao: fraseDaVersaoSemRevisao,
  processo_com_revisoes: fraseDoProcessoComRevisoes,
  aprovacao_fora_da_etapa: () => FRASE_DA_APROVACAO_FORA_DA_ETAPA,
  processo_ja_aprovado: () => FRASE_DO_PROCESSO_JA_APROVADO,
  link_invalido: () => FRASE_DO_LINK_INVALIDO,
  aprovacao_antes_da_revisao: fraseDaAprovacaoAntesDaRevisao,
  sem_aprovacao: fraseDaVersaoSemAprovacao,
  aprovacao_so_se_desfaz_na_volta: () => FRASE_DA_APROVACAO_NA_VOLTA,
  versao_aprovada: fraseDaVersaoAprovada,
  processo_com_aprovacao: () => FRASE_DO_PROCESSO_COM_APROVACAO,
  versao_incompleta: (valor) => {
    const [numero, faltas] = valor.split(':')
    return fraseDaVersaoIncompleta(numero, faltas.split(','))
  },
}

// Serve também à situação, à reclassificação e à gravação do processo: as recusas do banco têm o mesmo formato.
export function falhaDoAndamento(erro: ErroDoBanco, recusas: RecusasDoModulo): Error {
  const recusa = erro.message.match(PADRAO_DA_RECUSA)
  if (recusa) return new TravaDoBanco(FRASE_DA_RECUSA[recusa[1]]((recusa[2] ?? '').trim()))
  if (erro.message.includes('registro_inexistente')) return recusas.registroInexistente()
  return recusaPorPerfil(erro, recusas.semPermissao)
}
