import type { PapelDoArquivo } from '../../supabase/functions/_shared/nomePadrao.ts'

export type { PapelDoArquivo }

/** Um arquivo da versão como o banco o guarda; o nome é o padrão, gravado no envio. */
export type ArquivoDaVersao = { id: string; papel: PapelDoArquivo; nome: string; formato: string; tamanho: number }

/** Versão do processo (V7, ou V5F na histórica); `enviadaEm` é o instante ISO do envio. */
export type Versao = {
  id: string
  numero: number
  historica: boolean
  enviadaEm: string
  /** Nome de quem enviou; null se o usuário não puder ser lido. */
  autor: string | null
  /** Nome da etapa em que o processo estava no envio; a histórica não tem. */
  etapa: string | null
  observacao: string | null
  /** Na ordem dos papéis (.bpmn, .png, .bpm, relatório). */
  arquivos: ArquivoDaVersao[]
}

/** Um arquivo escolhido no formulário, para um papel. */
export type ArquivoEscolhido = { papel: PapelDoArquivo; arquivo: File }

/** O envio de uma versão: `numero` é o da prévia (nova) ou o digitado (histórica), com que os arquivos são nomeados no Drive. */
export type PedidoDeVersao = {
  processoId: string
  numero: number
  observacao: string | null
  arquivos: ArquivoEscolhido[]
}

/**
 * Único ponto por onde a interface fala com o banco e com a função do Drive nas versões. Recusa chega como
 * TravaDoBanco, com a frase pronta; outra falha, como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeVersoes = {
  /** As versões do processo, da mais recente para a mais antiga. */
  listarVersoes(processoId: string): Promise<Versao[]>
  /**
   * Envia cada arquivo direto ao Drive e só então registra a versão. `aoProgredir` avisa quantos arquivos já
   * chegaram. Se algo falhar, nada é registrado.
   */
  enviarVersao(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /**
   * Registra uma versão histórica (V5F) com o número digitado em `pedido.numero`: o mesmo caminho do envio, com as
   * regras da histórica (só antes da versão nova, número que ainda não existe, .bpm ou .bpmn e .png).
   */
  registrarVersaoHistorica(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /** Os bytes do arquivo, com o tipo do formato (o navegador o mostra se souber). Qualquer perfil ativo pode. */
  baixarArquivo(arquivo: ArquivoDaVersao): Promise<Blob>
}
