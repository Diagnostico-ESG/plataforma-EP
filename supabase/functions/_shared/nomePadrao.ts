// Arquivo puro (sem Deno nem npm:): usado pela função do servidor e, no ticket 02, pela prévia do formulário.
export type PapelDoArquivo = 'bpmn' | 'png' | 'bpm' | 'relatorio'

export interface DadosDoNome {
  sigla: string
  numero: number
  historica: boolean
  /** Versão piloto (V6P); omitida vale falso. Nunca junto com `historica`. */
  piloto?: boolean
  /** Só no relatório de versão que não é histórica (Relatório V3): o número próprio do relatório no processo. */
  numeroDoRelatorio?: number
  nomeDoProcesso: string
  papel: PapelDoArquivo
  extensao: string
}

// Os caracteres \ / : * ? " < > | e os de controle não valem em nome de arquivo no Windows e no Drive.
export function limparParaNomeDeArquivo(texto: string): string {
  return texto
    // eslint-disable-next-line no-control-regex -- os caracteres de controle são justamente o que se quer trocar
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function conferirNumero(numero: number, rotulo: string): void {
  if (Number.isInteger(numero) && numero > 0) return
  throw new Error(
    `número ${rotulo} inválido (recebido: ${numero}); esperado: número inteiro maior que zero`,
  )
}

function sufixoDoRelatorio(dados: DadosDoNome): string {
  if (dados.papel !== 'relatorio') return ''
  if (dados.numeroDoRelatorio === undefined) return '_Relatório'
  conferirNumero(dados.numeroDoRelatorio, 'do relatório')
  return `_Relatório V${dados.numeroDoRelatorio}`
}

export function nomePadrao(dados: DadosDoNome): string {
  conferirNumero(dados.numero, 'da versão')
  const letra = dados.historica ? 'F' : dados.piloto ? 'P' : ''
  const rotulo = `V${dados.numero}${letra}`
  const sufixo = sufixoDoRelatorio(dados)
  const sigla = limparParaNomeDeArquivo(dados.sigla)
  const nome = limparParaNomeDeArquivo(dados.nomeDoProcesso)
  return `${sigla}_${rotulo}_${nome}${sufixo}.${dados.extensao.toLowerCase()}`
}
