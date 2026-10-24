import { diaDeBrasilia } from '../lib/datas'
import type { Database } from '../types/database'
import type { DadosDoCartao, EtapaAtual, ProcessoDaLista, ResponsavelDoProcesso, SituacaoDoProcesso } from './tipos'

export type LinhaDoProcesso = Database['public']['Views']['processos_com_andamento']['Row']

// A view devolve tudo como "pode ser nulo"; os campos que a tela exige nascem preenchidos pelo banco. O total de etapas
// ativas não está na view: quem lê o catálogo o informa.
export function processoDaLinha(linha: LinhaDoProcesso, totalDeEtapas: number): ProcessoDaLista {
  return {
    ...identificacaoDaLinha(linha),
    situacao: (linha.situacao ?? 'em_andamento') as SituacaoDoProcesso,
    etapaAtual: etapaAtualDaLinha(linha, totalDeEtapas),
    etiqueta: linha.etiqueta ?? 'a_fazer',
    entrouNaEtapaEm: linha.entrou_na_etapa_em ? diaDeBrasilia(linha.entrou_na_etapa_em) : null,
    responsavel: responsavelDaLinha(linha),
    dataDaReuniao: linha.data_da_reuniao,
    cartao: cartaoDaLinha(linha),
    publicadoEm: linha.publicado_em,
    linkDaPublicacao: linha.link_da_publicacao,
    explicacaoSemPublicacao: linha.explicacao_sem_publicacao,
    arquivadoEm: linha.arquivado_em,
  }
}

function identificacaoDaLinha(linha: LinhaDoProcesso) {
  return {
    id: linha.id ?? '',
    nome: linha.nome ?? '',
    tipo: linha.tipo ?? 'a_classificar',
    setorId: linha.setor_id ?? '',
    setorSigla: linha.setor_sigla ?? '',
    macroprocessoId: linha.macroprocesso_id ?? '',
    macroprocessoNome: linha.macroprocesso_nome ?? '',
    processoPaiId: linha.processo_pai_id,
  }
}

function ultimaVersaoDaLinha(linha: LinhaDoProcesso): DadosDoCartao['ultimaVersao'] {
  if (linha.ultima_versao_numero == null) return null
  return {
    numero: linha.ultima_versao_numero, historica: linha.ultima_versao_historica ?? false,
    temRelatorio: linha.ultima_versao_tem_relatorio ?? false,
  }
}

function cartaoDaLinha(linha: LinhaDoProcesso): DadosDoCartao {
  return {
    responsavelAtivo: linha.responsavel_ativo ?? null,
    ultimaVersao: ultimaVersaoDaLinha(linha),
    subprocessos: linha.subprocessos_quantidade ?? 0,
  }
}

function etapaAtualDaLinha(linha: LinhaDoProcesso, total: number): EtapaAtual | null {
  if (linha.etapa_atual_codigo === null) return null
  return {
    id: linha.etapa_atual_id ?? '', codigo: linha.etapa_atual_codigo, nome: linha.etapa_atual_nome ?? '',
    ordem: linha.etapa_atual_ordem ?? 0, posicao: linha.etapa_atual_posicao ?? 0, total,
  }
}

function responsavelDaLinha(linha: LinhaDoProcesso): ResponsavelDoProcesso | null {
  if (linha.responsavel_id === null) return null
  return { id: linha.responsavel_id, nome: linha.responsavel_nome ?? '', fotoUrl: linha.responsavel_foto_url }
}
