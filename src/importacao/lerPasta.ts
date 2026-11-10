// A pasta DOCUMENTOS MAPEAMENTO lida no navegador (importação dos dados atuais, ticket 02): a lista de arquivos vira as
// versões de cada processo, pelo nome dos arquivos, com o que fica de fora. A pasta manda (amostra/pasta.md, decisões de
// 2026-11-06). Sem banco nem tela: a prévia e o envio usam o resultado.
import { chaveDaPasta } from './chaves'
import { type LetraDaVersao, type NomeLido, type PapelNaPasta, lerNomeDoArquivo } from './nomeDoArquivoDaPasta'

export { lerNomeDoArquivo }

export type TipoDaVersao = 'historica' | 'piloto' | 'sequencia'
/** `caminho` é o `webkitRelativePath`: pasta escolhida / setor / [subpasta /] arquivo. */
export type ArquivoDaPasta = { arquivo: File; caminho: string }

export type VersaoDaPasta = {
  chave: string
  sigla: string
  nomeDoProcesso: string
  numero: number
  rotulo: string
  tipo: TipoDaVersao
  bpm: File
  png: File | null
  relatorio: File | null
  pdfDoRelatorio: File | null
  /** A versão sem .bpm próprio usa o da versão seguinte (ajuste de 2026-11-10): o rótulo dela ("V3"); null com .bpm próprio. */
  bpmDaVersao: string | null
  /** Algum arquivo veio com letra diferente da do .bpm (história 43a): entrou na versão do .bpm, com aviso. */
  letraCorrigida: boolean
}

export type VersaoDeFora = { chave: string; sigla: string; nomeDoProcesso: string; numero: number; rotulo: string }
export type PastaLida = {
  versoes: VersaoDaPasta[]
  /** Versões sem .bpm e sem versão seguinte com .bpm no processo: não entram (história 45). */
  semBpm: VersaoDeFora[]
  /** Dois arquivos do mesmo papel na mesma versão: o relatório, o .png e o .pdf ficam de fora; com dois .bpm, a versão toda. */
  duplicados: (VersaoDeFora & { papel: PapelNaPasta })[]
  /** Caminhos dos arquivos fora do padrão do nome ou da pasta (história 47). */
  foraDoPadrao: string[]
  /** O processo cujos arquivos vieram de uma subpasta do setor (história 48b), uma vez por processo. */
  subpastas: { chave: string; subpasta: string }[]
}

type Lido = NomeLido & { arquivo: File; chave: string; subpasta: string | null }

const TIPO_DA_LETRA: Record<LetraDaVersao, TipoDaVersao> = { F: 'historica', P: 'piloto', '': 'sequencia' }

function lerUm({ arquivo, caminho }: ArquivoDaPasta): Lido | null {
  const partes = caminho.split('/')
  if (partes.length < 3) return null
  const nome = lerNomeDoArquivo(arquivo.name)
  if (!nome) return null
  const subpasta = partes.length > 3 ? partes.slice(2, -1).join('/') : null
  return { ...nome, arquivo, chave: chaveDaPasta(nome.sigla, nome.nomeDoProcesso), subpasta }
}

function agrupar(lidos: Lido[]): Lido[][] {
  const grupos = new Map<string, Lido[]>()
  for (const lido of lidos) {
    const chave = `${lido.chave}#${String(lido.numero)}`
    grupos.set(chave, [...(grupos.get(chave) ?? []), lido])
  }
  return [...grupos.values()].sort((a, b) => a[0].chave.localeCompare(b[0].chave) || a[0].numero - b[0].numero)
}

function deFora(grupo: Lido[], letra: LetraDaVersao): VersaoDeFora {
  const { chave, sigla, nomeDoProcesso, numero } = grupo[0]
  return { chave, sigla, nomeDoProcesso, numero, rotulo: `V${String(numero)}${letra}` }
}

// Um arquivo do papel, ou nenhum; dois ou mais vão para os duplicados e nenhum entra.
function umDoPapel(grupo: Lido[], papel: PapelNaPasta, letra: LetraDaVersao, lida: PastaLida): File | null {
  const doPapel = grupo.filter((lido) => lido.papel === papel)
  if (doPapel.length > 1) lida.duplicados.push({ ...deFora(grupo, letra), papel })
  return doPapel.length === 1 ? doPapel[0].arquivo : null
}

// O arquivo que entra em cada papel; o .bpm já vem escolhido (o próprio ou o da versão seguinte).
function acrescentarVersao(grupo: Lido[], letra: LetraDaVersao, bpm: File, bpmDaVersao: string | null, lida: PastaLida): void {
  const arquivos = {
    bpm, png: umDoPapel(grupo, 'png', letra, lida), relatorio: umDoPapel(grupo, 'relatorio', letra, lida),
    pdfDoRelatorio: umDoPapel(grupo, 'pdf', letra, lida),
  }
  // Só conta o arquivo que entra: o duplicado que ficou de fora já tem o seu aviso.
  const entram = Object.values(arquivos)
  const letraCorrigida = grupo.some((lido) => lido.letra !== letra && entram.includes(lido.arquivo))
  lida.versoes.push({ ...deFora(grupo, letra), tipo: TIPO_DA_LETRA[letra], ...arquivos, bpmDaVersao, letraCorrigida })
}

// Devolve o grupo sem .bpm, que só se resolve depois de todas as versões com .bpm montadas.
function montarVersao(grupo: Lido[], lida: PastaLida): Lido[] | null {
  const bpms = grupo.filter((lido) => lido.papel === 'bpm')
  if (bpms.length === 0) return grupo
  const { letra } = bpms[0]
  const bpm = umDoPapel(grupo, 'bpm', letra, lida)
  if (bpm) acrescentarVersao(grupo, letra, bpm, null, lida)
  return null
}

// As versões anteriores de um processo podem estar em abas do .bpm de uma versão mais nova (ajuste de 2026-11-10): a
// versão sem .bpm usa o .bpm próprio da versão seguinte do mesmo processo; sem ela, fica de fora (história 45).
function montarSemBpm(grupo: Lido[], lida: PastaLida): void {
  const { chave, numero, letra } = grupo[0]
  const seguinte = lida.versoes.filter((v) => v.chave === chave && v.numero > numero && v.bpmDaVersao === null)
    .sort((a, b) => a.numero - b.numero)[0]
  if (!seguinte) {
    lida.semBpm.push(deFora(grupo, letra))
    return
  }
  acrescentarVersao(grupo, letra, seguinte.bpm, seguinte.rotulo, lida)
}

function subpastasDosProcessos(lidos: Lido[]): PastaLida['subpastas'] {
  const vistas = new Map<string, string>()
  for (const { chave, subpasta } of lidos) if (subpasta && !vistas.has(chave)) vistas.set(chave, subpasta)
  return [...vistas].map(([chave, subpasta]) => ({ chave, subpasta }))
}

export function lerPasta(arquivos: ArquivoDaPasta[]): PastaLida {
  const lida: PastaLida = { versoes: [], semBpm: [], duplicados: [], foraDoPadrao: [], subpastas: [] }
  const lidos: Lido[] = []
  for (const item of arquivos) {
    const lido = lerUm(item)
    if (lido) lidos.push(lido)
    else lida.foraDoPadrao.push(item.caminho)
  }
  const semBpm = agrupar(lidos).map((grupo) => montarVersao(grupo, lida)).filter((grupo) => grupo !== null)
  for (const grupo of semBpm) montarSemBpm(grupo, lida)
  lida.subpastas = subpastasDosProcessos(lidos)
  return lida
}
