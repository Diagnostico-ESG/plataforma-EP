import type { Database } from '../types/database'
import type {
  DadosDoCartao, PedacoDoCaminho, ProcessoDaLista, ResponsavelDaEtapa, SituacaoDoProcesso, StatusDaEtapa,
} from './tipos'

export type LinhaDoProcesso = Database['public']['Views']['processos_com_andamento']['Row']

// A view devolve tudo como "pode ser nulo"; os campos que a tela exige nascem preenchidos pelo banco.
export function processoDaLinha(linha: LinhaDoProcesso): ProcessoDaLista {
  return {
    id: linha.id ?? '',
    nome: linha.nome ?? '',
    tipo: linha.tipo ?? 'a_classificar',
    setorId: linha.setor_id ?? '',
    setorSigla: linha.setor_sigla ?? '',
    macroprocessoId: linha.macroprocesso_id ?? '',
    macroprocessoNome: linha.macroprocesso_nome ?? '',
    processoPaiId: linha.processo_pai_id,
    situacao: (linha.situacao ?? 'em_andamento') as SituacaoDoProcesso,
    etapaAtual: etapaAtualDaLinha(linha),
    responsavel: responsavelDaLinha(linha),
    dataDaReuniao: linha.data_da_reuniao,
    cartao: cartaoDaLinha(linha),
    vaiParaPublicacao: linha.vai_para_publicacao,
    publicadoEm: linha.publicado_em,
  }
}

// O banco devolve o caminho como JSON solto (`Json`): é o único ponto onde ele vira a lista tipada, e o que não for lista
// de {codigo, status} vira lista vazia, para o cartão só ficar sem barra em vez de quebrar a tela.
function caminhoDaLinha(caminho: LinhaDoProcesso['caminho']): PedacoDoCaminho[] {
  if (!Array.isArray(caminho)) return []
  return caminho.flatMap((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return []
    const { codigo, status } = item
    return typeof codigo === 'string' && typeof status === 'string' ? [{ codigo, status: status as StatusDaEtapa }] : []
  })
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
    etapaAtualStatus: linha.etapa_atual_status === 'pendente' || linha.etapa_atual_status === 'em_andamento'
      ? linha.etapa_atual_status : null,
    etapaAtualIniciadaEm: linha.etapa_atual_iniciada_em ?? null,
    responsavelAtivo: linha.responsavel_ativo ?? null,
    caminho: caminhoDaLinha(linha.caminho),
    ultimaVersao: ultimaVersaoDaLinha(linha),
    subprocessos: linha.subprocessos_quantidade ?? 0,
  }
}

function etapaAtualDaLinha(linha: LinhaDoProcesso): ProcessoDaLista['etapaAtual'] {
  if (linha.etapa_atual_codigo === null) return null
  return { codigo: linha.etapa_atual_codigo, nome: linha.etapa_atual_nome ?? '', ordem: linha.etapa_atual_ordem ?? 0 }
}

function responsavelDaLinha(linha: LinhaDoProcesso): ResponsavelDaEtapa | null {
  if (linha.responsavel_id === null) return null
  return { id: linha.responsavel_id, nome: linha.responsavel_nome ?? '', fotoUrl: linha.responsavel_foto_url }
}
