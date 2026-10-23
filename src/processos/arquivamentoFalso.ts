import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { fraseDaDataNoFuturo } from '../revisoes/frasesDeAprovacao'
import { recalcularProcesso } from './andamentoFalso'
import { CODIGO_DA_PUBLICACAO } from './codigosDasEtapas'
import {
  FRASE_DA_DATA_DA_PUBLICACAO_OBRIGATORIA, FRASE_DA_PUBLICACAO_FORA_DE_ANDAMENTO, FRASE_DA_PUBLICACAO_JA_REGISTRADA,
  FRASE_DO_PROCESSO_ARQUIVADO, FRASE_DO_PROCESSO_JA_ARQUIVADO, FRASE_DO_PROCESSO_NAO_ARQUIVADO, FRASE_SEM_PUBLICACAO_PENDENTE,
  fraseDaPublicacaoAntesDaAprovacao, fraseDaPublicacaoSoNoConcluido, fraseDoArquivarSoConcluido,
} from './frasesDePublicacao'
import type { EtapaDoProcesso, ProcessoLido, StatusDaEtapa } from './tipos'

// As regras das funções do banco da migração arquivar_e_registrar_publicacao, para a implementação falsa.

/** Como a trava do banco: o arquivado não aceita outra alteração além de registrar publicação e desarquivar. */
export function conferirNaoArquivado(processo: ProcessoLido): void {
  if (processo.arquivadoEm) throw new TravaDoBanco(FRASE_DO_PROCESSO_ARQUIVADO)
}

function publicacaoNoStatus(processo: ProcessoLido, status: StatusDaEtapa): EtapaDoProcesso | undefined {
  return processo.etapasDoProcesso.find((etapa) => etapa.codigo === CODIGO_DA_PUBLICACAO && etapa.status === status)
}

function trocarPublicacao(processo: ProcessoLido, id: string, mudancas: Partial<EtapaDoProcesso>): EtapaDoProcesso[] {
  return processo.etapasDoProcesso.map((etapa) => (etapa.id === id ? { ...etapa, ...mudancas } : etapa))
}

/** Como nao_vai_mais_para_publicacao: motivo e Publicação em andamento; ela volta a pendente, sem responsável nem datas. */
export function desistirDaPublicacao(processo: ProcessoLido, motivo: string): ProcessoLido {
  if (motivo.trim() === '') throw new TravaDoBanco('O motivo é obrigatório.')
  const publicacao = publicacaoNoStatus(processo, 'em_andamento')
  if (!publicacao) throw new TravaDoBanco(FRASE_DA_PUBLICACAO_FORA_DE_ANDAMENTO)
  const etapas = trocarPublicacao(processo, publicacao.id, {
    status: 'pendente', iniciadaEm: null, resolvidaEm: null, nota: null, responsavelId: null, responsavelNome: null,
    responsavelInativo: false,
  })
  return recalcularProcesso({ ...processo, vaiParaPublicacao: false }, etapas)
}

type Registro = { data: string; hoje: string; aprovadaEm: string | null }

function conferirDataDaPublicacao({ data, hoje, aprovadaEm }: Registro): void {
  if (data === '') throw new TravaDoBanco(FRASE_DA_DATA_DA_PUBLICACAO_OBRIGATORIA)
  if (data > hoje) throw new TravaDoBanco(fraseDaDataNoFuturo(data))
  if (aprovadaEm && data < aprovadaEm) throw new TravaDoBanco(fraseDaPublicacaoAntesDaAprovacao(data, aprovadaEm))
}

function publicacaoARegistrar(processo: ProcessoLido): EtapaDoProcesso {
  if (processo.situacao !== 'concluido') throw new TravaDoBanco(fraseDaPublicacaoSoNoConcluido(processo.situacao))
  if (processo.publicadoEm) throw new TravaDoBanco(FRASE_DA_PUBLICACAO_JA_REGISTRADA)
  const publicacao = publicacaoNoStatus(processo, 'pendente')
  if (!publicacao) throw new TravaDoBanco(FRASE_SEM_PUBLICACAO_PENDENTE)
  return publicacao
}

/** Como registrar_publicacao: concluído não publicado; a Publicação fica concluída na data e o processo, onde estava. */
export function registrarPublicacao(processo: ProcessoLido, registro: Registro): ProcessoLido {
  const publicacao = publicacaoARegistrar(processo)
  conferirDataDaPublicacao(registro)
  const etapas = trocarPublicacao(processo, publicacao.id, { status: 'concluida', iniciadaEm: registro.data, resolvidaEm: registro.data })
  return recalcularProcesso({ ...processo, vaiParaPublicacao: true, publicadoEm: registro.data }, etapas)
}

/** Como arquivar_processo: só o concluído não arquivado. */
export function arquivar(processo: ProcessoLido, agora: string): ProcessoLido {
  if (processo.arquivadoEm) throw new TravaDoBanco(FRASE_DO_PROCESSO_JA_ARQUIVADO)
  if (processo.situacao !== 'concluido') throw new TravaDoBanco(fraseDoArquivarSoConcluido(processo.situacao))
  return { ...processo, arquivadoEm: agora }
}

/** Como desarquivar_processo: só o arquivado. */
export function desarquivar(processo: ProcessoLido): ProcessoLido {
  if (!processo.arquivadoEm) throw new TravaDoBanco(FRASE_DO_PROCESSO_NAO_ARQUIVADO)
  return { ...processo, arquivadoEm: null }
}
