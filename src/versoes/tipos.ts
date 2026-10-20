import type { SituacaoNoDrive } from '../../supabase/functions/_shared/conferencia.ts'
import type { PapelDoArquivo } from '../../supabase/functions/_shared/nomePadrao.ts'

export type { PapelDoArquivo, SituacaoNoDrive }

/** Um arquivo da versão como o banco o guarda; o nome é o padrão, gravado no envio. */
export type ArquivoDaVersao = {
  id: string
  papel: PapelDoArquivo
  nome: string
  formato: string
  tamanho: number
  /** Só no relatório de "sem alteração de conteúdo": o id do relatório da versão anterior, de onde veio. */
  copiadoDe?: string
}

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
  /** Na ordem de exibição (.png, .bpm, relatório, .bpmn). */
  arquivos: ArquivoDaVersao[]
  /** Verdadeiro na versão que o setor aprovou (ADR 0011): ganha o selo "Aprovada" e não tem arquivo substituído. Ausente: não. */
  aprovada?: boolean
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

/** O relatório que entra numa versão nova que ainda não tem; `numero` é o da versão, com que o arquivo é nomeado no Drive. */
export type PedidoDeRelatorio = { processoId: string; versaoId: string; numero: number; arquivo: File }

/** A troca do conteúdo de um arquivo de versão nova; `numero` é o da versão, que a função do servidor repete no pedido. */
export type PedidoDeSubstituicao = { processoId: string; numero: number; arquivo: ArquivoDaVersao; novo: File }

/** Como cada arquivo do processo está no Drive agora (MD5 e existência comparados com o banco), pelo id do arquivo. */
export type ConferenciaDosArquivos = Record<string, SituacaoNoDrive>

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
  /**
   * Envia o relatório direto ao Drive e só então o registra na versão (que ainda não tem relatório). `aoProgredir`
   * avisa quando o arquivo chegou. Se algo falhar, nada é registrado.
   */
  acrescentarRelatorio(pedido: PedidoDeRelatorio, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /**
   * "Sem alteração de conteúdo": a função copia no Drive o relatório da versão anterior, com o nome desta versão, e o
   * registra ligado ao original. Só vale na versão nova sem relatório, cuja anterior tem relatório.
   */
  semAlteracaoDeConteudo(processoId: string, versaoId: string): Promise<void>
  /**
   * Troca o conteúdo de um arquivo de versão nova pelo de `pedido.novo` (do mesmo papel e formato): envia direto ao Drive,
   * no mesmo arquivo, e só então registra a troca. O arquivo anterior não fica guardado (ADR 0007). `aoProgredir` avisa
   * quando o arquivo chegou. Se algo falhar, nada é registrado.
   */
  substituirArquivo(pedido: PedidoDeSubstituicao, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /**
   * Como cada arquivo do processo está no Drive agora: o MD5 e a existência são comparados com o que o banco guarda; nada é
   * gravado. Falha de conexão ou do Drive rejeita (a tela mostra o aviso, sem marcas).
   */
  conferirArquivos(processoId: string): Promise<ConferenciaDosArquivos>
  /** Os bytes do arquivo, com o tipo do formato (o navegador o mostra se souber). Qualquer perfil ativo pode. */
  baixarArquivo(arquivo: ArquivoDaVersao): Promise<Blob>
}
