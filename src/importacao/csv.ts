export type LinhaDoCsv = string[]

/**
 * O Excel em português salva .csv com ponto e vírgula e, no formato "CSV (separado por vírgulas)", em ANSI
 * (windows-1252); o "CSV UTF-8" traz a marca BOM. Tenta UTF-8 e, se o texto não for válido, cai para windows-1252.
 */
export function decodificarArquivo(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

// Vale o separador mais usado na linha do cabeçalho (a que traz "Processos"); as Observações têm vírgulas à vontade.
function separadorDe(texto: string): string {
  const cabecalho = texto.split('\n').find((linha) => /processos/i.test(linha)) ?? ''
  const pontoEVirgula = cabecalho.split(';').length
  return pontoEVirgula >= cabecalho.split(',').length ? ';' : ','
}

type Estado = { linhas: LinhaDoCsv[]; celulas: string[]; campo: string; entreAspas: boolean }

function fecharCampo(estado: Estado): void {
  estado.celulas.push(estado.campo)
  estado.campo = ''
}

function fecharLinha(estado: Estado): void {
  fecharCampo(estado)
  estado.linhas.push(estado.celulas)
  estado.celulas = []
}

// Dentro de aspas, `""` é uma aspa; devolve quantos caracteres a mais foram usados.
function lerDentroDasAspas(estado: Estado, c: string, proximo: string | undefined): number {
  if (c !== '"') estado.campo += c
  else if (proximo === '"') { estado.campo += '"'; return 1 }
  else estado.entreAspas = false
  return 0
}

function lerForaDasAspas(estado: Estado, c: string, separador: string): void {
  if (c === '"') estado.entreAspas = true
  else if (c === separador) fecharCampo(estado)
  else if (c === '\n') fecharLinha(estado)
  else if (c !== '\r') estado.campo += c
}

/** Lê o texto do .csv em linhas de células, com campos entre aspas (que podem ter separador e quebra de linha). */
export function lerCsv(texto: string): LinhaDoCsv[] {
  const limpo = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto
  const separador = separadorDe(limpo)
  const estado: Estado = { linhas: [], celulas: [], campo: '', entreAspas: false }
  for (let i = 0; i < limpo.length; i++) {
    if (estado.entreAspas) i += lerDentroDasAspas(estado, limpo[i], limpo[i + 1])
    else lerForaDasAspas(estado, limpo[i], separador)
  }
  if (estado.campo !== '' || estado.celulas.length > 0) fecharLinha(estado)
  return estado.linhas
}
