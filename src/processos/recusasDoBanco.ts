import { type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, recusaPorPerfil } from '../acesso/falhasDeGravacao'
import {
  FRASE_DA_APROVACAO_FORA_DA_ETAPA, FRASE_DO_LINK_INVALIDO, FRASE_DO_PROCESSO_COM_APROVACAO, FRASE_DO_PROCESSO_JA_APROVADO,
  fraseDaAprovacaoAntesDaRevisao, fraseDaDataNoFuturo, fraseDaVersaoAprovada, fraseDaVersaoSemAprovacao,
} from '../revisoes/frasesDeAprovacao'
import {
  FRASE_DA_CORRIGIDA_SEM_ANTERIOR, FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR, FRASE_DA_REVISAO_FORA_DA_ETAPA,
  FRASE_DO_ESCOPO_OBRIGATORIO, FRASE_DO_ESCOPO_SO_NA_CORRIGIDA, fraseDaVersaoSemRevisao, fraseDoProcessoComRevisoes,
  fraseDoRevisorQueEAutor,
} from '../revisoes/frasesDeRevisao'
import { fraseDasAnotacoesLongas } from './frasesDasAnotacoes'
import { FRASE_DAS_ETAPAS_FIXAS, fraseDaEtapaComProcessos, fraseDaEtapaProtegida, fraseDaEtapaUsada } from './frasesDoCatalogo'
import { FRASE_SEM_VERSAO, fraseDaVersaoIncompleta } from './frasesDaVersaoCompleta'
import {
  FRASE_DA_CHEGADA_OBRIGATORIA, FRASE_DA_EXPLICACAO_OBRIGATORIA, FRASE_DA_ETIQUETA_FIXA, FRASE_DA_PASSAGEM_FECHADA,
  FRASE_DA_PASSAGEM_SO_PELA_FUNCAO, fraseDaEtapaInativa, fraseDaExplicacaoLonga,
} from './frasesDoMovimento'
import { FRASE_DO_PAI, fraseDeTipoInvalido, fraseDosSubprocessos } from './frasesDeReclassificacao'
import {
  FRASE_DO_ARQUIVAMENTO_SO_PELA_FUNCAO, FRASE_DO_PROCESSO_ARQUIVADO, FRASE_DO_PROCESSO_JA_ARQUIVADO,
  FRASE_DO_PROCESSO_NAO_ARQUIVADO, fraseDoArquivarSoConcluido,
} from './frasesDePublicacao'
import { fraseDoAutorDaVersao, fraseDoProcessoComVersoes } from './frasesDeVersao'
import { fraseDeSituacaoInvalida, fraseDoProcessoParado } from './frasesDeSituacao'

/** O que a pessoa tentava fazer, para as frases que o banco não diz (desativar ou excluir a etapa). */
export type ContextoDaRecusa = { acao?: 'desativar' | 'excluir' }

// O banco recusa com "motivo:valor" (migrações do modelo de processos, do catálogo, das versões, das revisões, da
// aprovação, do arquivamento, das anotações e do Andamento livre). O motivo "motivo_obrigatorio" não tem valor; o valor
// vai até o fim da mensagem.
const PADRAO_DA_RECUSA = new RegExp(
  '\\b(data_no_futuro|motivo_obrigatorio|responsavel_invalido|processo_parado'
  + '|situacao_invalida|processo_com_subprocessos|pai_nao_e_processo|tipo_invalido'
  + '|etapa_usada|etapa_protegida|etapa_fixa|etapas_fixas_nas_pontas|etapa_com_processos'
  + '|etapa_inativa|publicacao_ou_explicacao_obrigatoria|explicacao_obrigatoria|explicacao_longa'
  + '|etiqueta_fixa_em_concluidos|passagem_fechada|passagem_so_pela_funcao'
  + '|processo_com_versoes|autor_da_versao|sem_versao|versao_incompleta'
  + '|revisor_e_autor|corrigida_sem_versao_do_revisor|corrigida_sem_versao_anterior|escopo_obrigatorio'
  + '|escopo_so_na_corrigida|revisao_fora_da_etapa|sem_revisao_da_versao|processo_com_revisoes'
  + '|aprovacao_fora_da_etapa|processo_ja_aprovado|link_invalido|aprovacao_antes_da_revisao|sem_aprovacao'
  + '|aprovacao_nao_se_apaga|versao_aprovada|processo_com_aprovacao'
  + '|arquivar_so_concluido|ja_arquivado|nao_arquivado|processo_arquivado|arquivamento_so_pela_funcao'
  + '|anotacoes_longas)(?::(.*))?$', 'm')

type FraseDaRecusa = (valor: string, contexto: ContextoDaRecusa) => string

// "nome:quantidade": o nome pode ter espaços, então a contagem é o que vem depois do último ":".
function etapaComProcessos(valor: string, { acao = 'desativar' }: ContextoDaRecusa): string {
  const separador = valor.lastIndexOf(':')
  return fraseDaEtapaComProcessos(valor.slice(0, separador), valor.slice(separador + 1), acao)
}

const FRASE_DA_RECUSA: Record<string, FraseDaRecusa> = {
  data_no_futuro: fraseDaDataNoFuturo,
  motivo_obrigatorio: () => 'O motivo é obrigatório.',
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
  etapa_protegida: fraseDaEtapaProtegida,
  etapa_fixa: () => FRASE_DAS_ETAPAS_FIXAS,
  etapas_fixas_nas_pontas: () => FRASE_DAS_ETAPAS_FIXAS,
  etapa_com_processos: etapaComProcessos,
  etapa_inativa: fraseDaEtapaInativa,
  publicacao_ou_explicacao_obrigatoria: () => FRASE_DA_CHEGADA_OBRIGATORIA,
  explicacao_obrigatoria: () => FRASE_DA_EXPLICACAO_OBRIGATORIA,
  explicacao_longa: fraseDaExplicacaoLonga,
  etiqueta_fixa_em_concluidos: () => FRASE_DA_ETIQUETA_FIXA,
  passagem_fechada: () => FRASE_DA_PASSAGEM_FECHADA,
  passagem_so_pela_funcao: () => FRASE_DA_PASSAGEM_SO_PELA_FUNCAO,
  processo_com_versoes: fraseDoProcessoComVersoes,
  autor_da_versao: fraseDoAutorDaVersao,
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
  aprovacao_nao_se_apaga: () => 'A aprovação registrada não se apaga; edite-a para corrigir.',
  versao_aprovada: fraseDaVersaoAprovada,
  processo_com_aprovacao: () => FRASE_DO_PROCESSO_COM_APROVACAO,
  arquivar_so_concluido: fraseDoArquivarSoConcluido,
  ja_arquivado: () => FRASE_DO_PROCESSO_JA_ARQUIVADO,
  nao_arquivado: () => FRASE_DO_PROCESSO_NAO_ARQUIVADO,
  processo_arquivado: () => FRASE_DO_PROCESSO_ARQUIVADO,
  arquivamento_so_pela_funcao: () => FRASE_DO_ARQUIVAMENTO_SO_PELA_FUNCAO,
  anotacoes_longas: fraseDasAnotacoesLongas,
  versao_incompleta: (valor) => {
    const [numero, faltas] = valor.split(':')
    return fraseDaVersaoIncompleta(numero, faltas.split(','))
  },
}

/**
 * Serve a todos os módulos de processos (movimento, situação, reclassificação, gravação, catálogo, revisões): as recusas
 * do banco têm o mesmo formato. Recusa conhecida vira TravaDoBanco com a frase pronta; processo que já não existe, o
 * aviso de cadastro inexistente; o resto, a recusa por perfil ou o erro inesperado.
 */
export function falhaDoBanco(erro: ErroDoBanco, recusas: RecusasDoModulo, contexto: ContextoDaRecusa = {}): Error {
  const recusa = erro.message.match(PADRAO_DA_RECUSA)
  if (recusa) return new TravaDoBanco(FRASE_DA_RECUSA[recusa[1]]((recusa[2] ?? '').trim(), contexto))
  if (erro.message.includes('registro_inexistente')) return recusas.registroInexistente()
  return recusaPorPerfil(erro, recusas.semPermissao)
}
