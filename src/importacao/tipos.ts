import type { ProcessoLido } from './lerPlanilha'

/** O que o banco recebe de cada processo da planilha. */
export type ProcessoParaImportar = Pick<
  ProcessoLido, 'setor' | 'macroprocesso' | 'nome' | 'etapaCodigo' | 'dataDaPublicacao' | 'dataDaModelagemPiloto' | 'anotacoes'
>

export type ResultadoDaGravacao = 'criado' | 'ja_existia'

/** O que a plataforma já tem, na forma de comparar: siglas em maiúsculas, macroprocessos em minúsculas e `chaveDoProcesso`. */
export type ExistentesNaPlataforma = { setores: string[]; macroprocessos: string[]; processos: string[] }

/**
 * Único ponto por onde a interface fala com o banco na importação. Recusa do banco chega como TravaDoBanco, com a frase
 * pronta; outra falha, como Error cuja mensagem é o motivo.
 */
export type ModuloDeImportacao = {
  /** Para a prévia marcar o que já existe; a gravação confere de novo no banco. */
  listarExistentes(): Promise<ExistentesNaPlataforma>
  /** Um processo por vez, inteiro ou nada; nunca altera o que já existe. */
  gravarProcesso(processo: ProcessoParaImportar): Promise<ResultadoDaGravacao>
}
