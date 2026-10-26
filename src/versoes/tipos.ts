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
  /** Só no relatório novo de versão que não é histórica (Relatório V3): o número próprio dele no processo (ADR 0026). */
  numeroDoRelatorio?: number
}

/** Versão do processo (V7, ou V5F na histórica); `enviadaEm` é o instante ISO do envio. */
export type Versao = {
  id: string
  numero: number
  historica: boolean
  /** Versão piloto (V6P), da Modelagem piloto: número digitado, antes da primeira versão em sequência. */
  piloto: boolean
  enviadaEm: string
  /** Nome de quem enviou; null se o usuário não puder ser lido. */
  autor: string | null
  /** Nome da etapa em que o processo estava no envio; a histórica não tem. */
  etapa: string | null
  /** Na ordem de exibição (.png, .bpm, relatório, .bpmn). */
  arquivos: ArquivoDaVersao[]
  /** Verdadeiro na versão que o setor aprovou (ADR 0011): ganha o selo "Aprovada" e não tem arquivo substituído. Ausente: não. */
  aprovada?: boolean
}

/** Um arquivo escolhido no formulário, para um papel. */
export type ArquivoEscolhido = { papel: PapelDoArquivo; arquivo: File }

/**
 * O envio de uma versão: `numero` é o da prévia (em sequência) ou o digitado (histórica e piloto), com que os arquivos são
 * nomeados no Drive. `piloto` vale falso quando omitido. `numeroDoRelatorio` é o da prévia do relatório que vai junto
 * (só na versão em sequência), com que o arquivo é nomeado.
 */
export type PedidoDeVersao = {
  processoId: string
  numero: number
  piloto?: boolean
  numeroDoRelatorio?: number
  arquivos: ArquivoEscolhido[]
}

/** O .png ou .bpmn que entra depois numa versão piloto ou em sequência; `numero` e `piloto` são da versão (o nome no Drive). */
export type PedidoDeAcrescimo = {
  processoId: string
  versaoId: string
  numero: number
  piloto: boolean
  papel: 'png' | 'bpmn'
  arquivo: File
}

/**
 * O relatório enviado sozinho (ADR 0026): vai para a versão mais recente que não é histórica. `numeroDaVersao` (e `piloto`)
 * e `numeroDoRelatorio` são os da prévia, com que o arquivo é nomeado no Drive; o banco recusa se mudaram.
 */
export type PedidoDeRelatorio = {
  processoId: string
  numeroDaVersao: number
  piloto: boolean
  numeroDoRelatorio: number
  arquivo: File
}

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
   * Envia cada arquivo direto ao Drive e só então registra a versão (em sequência, ou piloto com `pedido.piloto`). `aoProgredir` avisa quantos arquivos já
   * chegaram. Se algo falhar, nada é registrado.
   */
  enviarVersao(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /**
   * Envia o .png ou o .bpmn direto ao Drive e só então o registra na versão piloto ou em sequência que ainda não o tem.
   * `aoProgredir` avisa quando o arquivo chegou. Se algo falhar, nada é registrado.
   */
  acrescentarArquivo(pedido: PedidoDeAcrescimo, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /**
   * Registra uma versão histórica (V5F) com o número digitado em `pedido.numero`: o mesmo caminho do envio, com as
   * regras da histórica (só em Não iniciados e antes da piloto e da em sequência, número que ainda não existe, .bpm ou .bpmn e .png).
   */
  registrarVersaoHistorica(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void>
  /**
   * Envia o relatório (.docx) direto ao Drive e só então o registra, com a numeração própria, na versão mais recente que
   * não é histórica. `aoProgredir` avisa quando o arquivo chegou. Se algo falhar, nada é registrado.
   */
  enviarRelatorio(pedido: PedidoDeRelatorio, aoProgredir: (enviados: number, total: number) => void): Promise<void>
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
