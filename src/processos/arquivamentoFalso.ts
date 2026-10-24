import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import {
  FRASE_DO_PROCESSO_ARQUIVADO, FRASE_DO_PROCESSO_JA_ARQUIVADO, FRASE_DO_PROCESSO_NAO_ARQUIVADO, fraseDoArquivarSoConcluido,
} from './frasesDePublicacao'
import type { ProcessoLido } from './tipos'

// As regras das funções do banco da migração arquivar_e_registrar_publicacao, para a implementação falsa.

/** Como a trava do banco: o arquivado não aceita outra alteração além de desarquivar (e registrar a publicação sem data). */
export function conferirNaoArquivado(processo: ProcessoLido): void {
  if (processo.arquivadoEm) throw new TravaDoBanco(FRASE_DO_PROCESSO_ARQUIVADO)
}

/** Como arquivar_processo: o concluído, o suspenso e o cancelado, não arquivados. */
export function arquivar(processo: ProcessoLido, agora: string): ProcessoLido {
  if (processo.arquivadoEm) throw new TravaDoBanco(FRASE_DO_PROCESSO_JA_ARQUIVADO)
  if (processo.situacao === 'em_andamento') throw new TravaDoBanco(fraseDoArquivarSoConcluido())
  return { ...processo, arquivadoEm: agora }
}

/** Como desarquivar_processo: só o arquivado. */
export function desarquivar(processo: ProcessoLido): ProcessoLido {
  if (!processo.arquivadoEm) throw new TravaDoBanco(FRASE_DO_PROCESSO_NAO_ARQUIVADO)
  return { ...processo, arquivadoEm: null }
}
