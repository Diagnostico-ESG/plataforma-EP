import type { Database } from '../types/database'
import type { ProcessoDaLista, ResponsavelDaEtapa, SituacaoDoProcesso } from './tipos'

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
