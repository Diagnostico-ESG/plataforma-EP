/**
 * O anexo como a tela o lê (documentos-versoes, ticket 12): o arquivo avulso do processo, com a etapa em que o processo estava
 * no envio. Tem a forma de um `ArquivoDaVersao` (id, papel, nome, formato, tamanho), então o link de download e a marca da
 * conferência com o Drive servem sem mudança. `enviadoEm` é o instante ISO do envio.
 */
export type Anexo = {
  id: string
  papel: 'anexo'
  nome: string
  formato: string
  tamanho: number
  /** Nome da etapa em que o processo estava no envio; null se não puder ser lida. */
  etapa: string | null
  /** Nome de quem enviou; null se o usuário não puder ser lido. */
  autor: string | null
  enviadoEm: string
}

export type PedidoDeAnexo = { processoId: string; arquivo: File }

/**
 * Único ponto por onde a interface fala com o banco e com a função do Drive nos anexos. Recusa chega como TravaDoBanco,
 * com a frase pronta; outra falha, como Error cuja mensagem é o motivo. Baixar e conferir são os do módulo de versões
 * (`baixarArquivo` e `conferirArquivos`): é o mesmo caminho na função.
 */
export type ModuloDeAnexos = {
  /** Os anexos do processo, do mais recente para o mais antigo. */
  listarAnexos(processoId: string): Promise<Anexo[]>
  /**
   * Envia o arquivo direto ao Drive, na subpasta "Anexos" do processo, e só então o registra com o nome original.
   * `aoProgredir` avisa quando o arquivo chegou. Se algo falhar, nada é registrado.
   */
  enviarAnexo(pedido: PedidoDeAnexo, aoProgredir: (enviados: number, total: number) => void): Promise<void>
}
