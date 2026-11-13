import type { ArquivoEscolhido } from '../versoes/tipos'
import type { TipoDaVersao } from './lerPasta'
import type { ProcessoLido } from './lerPlanilha'

/** O que o banco recebe de cada processo da planilha. */
export type ProcessoParaImportar = Pick<
  ProcessoLido, 'setor' | 'macroprocesso' | 'nome' | 'etapaCodigo' | 'dataDaPublicacao' | 'dataDaModelagemPiloto' | 'anotacoes'
>

export type ResultadoDaGravacao = 'criado' | 'ja_existia'

/** O que a plataforma já tem, na forma de comparar: siglas em maiúsculas, macroprocessos em minúsculas e `chaveDoProcesso`. */
export type ExistentesNaPlataforma = { setores: string[]; macroprocessos: string[]; processos: string[] }

/** Um processo da plataforma, como a importação dos arquivos (ticket 02) o compara com a pasta. */
export type ProcessoDaPasta = {
  id: string
  /** `chaveDaPasta(sigla, nome)`: casa com o processo dos nomes dos arquivos. */
  chave: string
  nome: string
  /** Os números das versões que o processo já tem (as da pasta com esses números são puladas). */
  versoes: number[]
  /** O maior número de relatório do processo (ADR 0026), ou 0: o próximo relatório importado leva o seguinte. */
  maiorRelatorio: number
  /** Os nomes dos anexos do processo, em minúsculas: o .pdf de relatório que já está lá não é enviado de novo (história 53). */
  anexos: string[]
}
export type ProcessosParaAPasta = {
  processos: ProcessoDaPasta[]
  /** Já houve importação da planilha (a seção dos arquivos só habilita depois dela). */
  haImportado: boolean
}

/** Uma versão da pasta a enviar: `numero` é o do nome do arquivo; `numeroDoRelatorio`, só na que não é histórica e leva relatório. */
export type PedidoDeImportacaoDeVersao = {
  processoId: string
  numero: number
  tipo: TipoDaVersao
  numeroDoRelatorio: number | null
  arquivos: ArquivoEscolhido[]
}
export type ResultadoDaVersao = 'criada' | 'ja_existia'

/** Um relatório numerado ainda com V no nome (ADR 0047), como a seção "3. Relatórios com R" o renomeia. */
export type RelatorioComV = { arquivoId: string; nome: string }
/** Os relatórios a renomear e quantos relatórios numerados têm nome fora do padrão (estes ficam como estão). */
export type RelatoriosComV = { aRenomear: RelatorioComV[]; foraDoPadrao: number }

/**
 * Único ponto por onde a interface fala com o banco na importação. Recusa do banco chega como TravaDoBanco, com a frase
 * pronta; outra falha, como Error cuja mensagem é o motivo.
 */
export type ModuloDeImportacao = {
  /** Para a prévia marcar o que já existe; a gravação confere de novo no banco. */
  listarExistentes(): Promise<ExistentesNaPlataforma>
  /** Um processo por vez, inteiro ou nada; nunca altera o que já existe. */
  gravarProcesso(processo: ProcessoParaImportar): Promise<ResultadoDaGravacao>
  /** Os processos e as versões que já existem, para a prévia da pasta (a gravação confere de novo no banco). */
  listarProcessosDaPasta(): Promise<ProcessosParaAPasta>
  /**
   * Envia os arquivos da versão direto ao Drive, um por vez, e só então a registra, sem as travas de etapa do envio comum.
   * Se algo falhar, nada é registrado; a versão que já existe volta como "ja_existia".
   */
  importarVersao(pedido: PedidoDeImportacaoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<ResultadoDaVersao>
  /** O .pdf do relatório nos anexos do processo (história 48); o de mesmo nome volta como "ja_existia". */
  importarAnexo(processoId: string, arquivo: File): Promise<ResultadoDaGravacao>
  /** A linha da subpasta de onde vieram os arquivos, no fim das Anotações; não se repete (história 48b). */
  anotarSubpasta(processoId: string, subpasta: string): Promise<void>
  /** Os relatórios numerados com V no nome e quantos fogem do padrão (ADR 0047); a renomeação confere de novo no banco. */
  listarRelatoriosComV(): Promise<RelatoriosComV>
  /** Um relatório por vez ganha o R, no Drive e na plataforma; o que já está com R não muda. */
  renomearRelatorio(relatorio: RelatorioComV): Promise<void>
}
