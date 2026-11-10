// O nome dos arquivos da pasta DOCUMENTOS MAPEAMENTO (importação dos dados atuais, ticket 02; amostra/pasta.md):
// SIGLA_V<número><F|P|>_<Nome do processo>[_Relatório].<extensão>. Sem banco nem tela.

/** O papel do arquivo na versão: o .pdf de relatório não é da versão, vai para os Outros anexos (história 48). */
export type PapelNaPasta = 'bpm' | 'png' | 'relatorio' | 'pdf'
export type LetraDaVersao = 'F' | 'P' | ''

export type NomeLido = {
  sigla: string
  numero: number
  letra: LetraDaVersao
  nomeDoProcesso: string
  papel: PapelNaPasta
}

// O nome do processo é texto livre (acentos, vírgulas, " - "); o "_Relatório" do fim, quando há, não faz parte dele.
const PADRAO_DO_NOME = /^([^_]+)_V(\d+)([FP]?)_(.+?)(_Relatório)?\.([A-Za-z0-9]+)$/i

function papelDoArquivo(extensao: string, relatorio: boolean): PapelNaPasta | null {
  if (!relatorio && (extensao === 'bpm' || extensao === 'png')) return extensao
  if (relatorio && extensao === 'docx') return 'relatorio'
  if (relatorio && extensao === 'pdf') return 'pdf'
  return null
}

/** Null quando o nome não segue o padrão, ou quando a extensão não combina com a marca de relatório. */
export function lerNomeDoArquivo(nome: string): NomeLido | null {
  // NFC: o Windows pode entregar o "ó" de Relatório decomposto.
  const achado = PADRAO_DO_NOME.exec(nome.normalize('NFC'))
  if (!achado) return null
  const [, sigla, numero, letra, nomeDoProcesso, relatorio, extensao] = achado
  const papel = papelDoArquivo(extensao.toLowerCase(), relatorio !== undefined)
  if (!papel) return null
  return { sigla, numero: Number(numero), letra: letra.toUpperCase() as LetraDaVersao, nomeDoProcesso: nomeDoProcesso.trim(), papel }
}
