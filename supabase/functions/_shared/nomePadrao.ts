// Arquivo puro (sem Deno nem npm:): usado pela função do servidor e, no ticket 02, pela prévia do formulário.
export type PapelDoArquivo = 'bpmn' | 'png' | 'bpm' | 'relatorio'

export interface DadosDoNome {
  sigla: string
  numero: number
  historica: boolean
  /** Versão piloto (V6P); omitida vale falso. Nunca junto com `historica`. */
  piloto?: boolean
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

function conferirNumero(numero: number): void {
  if (Number.isInteger(numero) && numero > 0) return
  throw new Error(
    `número da versão inválido (recebido: ${numero}); esperado: número inteiro maior que zero`,
  )
}

export function nomePadrao(dados: DadosDoNome): string {
  conferirNumero(dados.numero)
  const letra = dados.historica ? 'F' : dados.piloto ? 'P' : ''
  const rotulo = `V${dados.numero}${letra}`
  const sufixo = dados.papel === 'relatorio' ? '_Relatório' : ''
  const sigla = limparParaNomeDeArquivo(dados.sigla)
  const nome = limparParaNomeDeArquivo(dados.nomeDoProcesso)
  return `${sigla}_${rotulo}_${nome}${sufixo}.${dados.extensao.toLowerCase()}`
}
