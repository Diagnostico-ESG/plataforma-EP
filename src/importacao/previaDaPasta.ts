// A prévia da importação dos arquivos (ticket 02): a pasta lida cruzada com o que a plataforma já tem. Nada aqui grava; o
// envio (enviarPasta) e a tela usam o resultado.
import { type Lacunas, lacunasDaPasta } from './lacunasDaPasta'
import type { PastaLida, VersaoDaPasta } from './lerPasta'
import type { PlanilhaLida } from './lerPlanilha'
import type { ProcessoDaPasta } from './tipos'

export type ProcessoNaPrevia = {
  processo: ProcessoDaPasta
  /** Em ordem crescente de número: o relatório numerado segue essa ordem (ADR 0026). */
  entram: VersaoDaPasta[]
  /** As versões cujo número o processo já tem (história 51). */
  puladas: VersaoDaPasta[]
  /** Versões puladas cujo .pdf de relatório ainda não está nos anexos: só o .pdf vai (história 53, repetir completa o que faltou). */
  pdfsQueFaltam: VersaoDaPasta[]
  subpasta: string | null
}
/** Arquivos cuja sigla e nome não batem com nenhum processo da plataforma (história 47), pelo processo do nome. */
export type SemProcesso = { chave: string; sigla: string; nomeDoProcesso: string; rotulos: string[] }

export type PreviaDaPasta = {
  porProcesso: ProcessoNaPrevia[]
  semProcesso: SemProcesso[]
  pasta: PastaLida
  lacunas: Lacunas
  totalDeVersoes: number
  /** Os arquivos das versões que entram (a contagem da frase da prévia). */
  arquivosDasVersoes: number
  totalDePdfsQueFaltam: number
  /** Tudo o que vai ao Drive: os arquivos das versões e os .pdf que faltam (o andamento "N de M"). */
  totalDeArquivos: number
  totalDePuladas: number
}

/** Os arquivos que a versão leva ao Drive: o .bpm e, se houver, o .png, o relatório e o .pdf do relatório. */
export function arquivosDaVersao(versao: VersaoDaPasta): number {
  return [versao.bpm, versao.png, versao.relatorio, versao.pdfDoRelatorio].filter((arquivo) => arquivo !== null).length
}

function processoNaPrevia(processo: ProcessoDaPasta, pasta: PastaLida): ProcessoNaPrevia {
  const daPasta = pasta.versoes.filter((v) => v.chave === processo.chave).sort((a, b) => a.numero - b.numero)
  const existe = (v: VersaoDaPasta) => processo.versoes.includes(v.numero)
  const puladas = daPasta.filter(existe)
  const pdfFalta = (v: VersaoDaPasta) => v.pdfDoRelatorio !== null && !processo.anexos.includes(v.pdfDoRelatorio.name.toLowerCase())
  return {
    processo, entram: daPasta.filter((v) => !existe(v)), puladas, pdfsQueFaltam: puladas.filter(pdfFalta),
    subpasta: pasta.subpastas.find((s) => s.chave === processo.chave)?.subpasta ?? null,
  }
}

function semProcessoNaPlataforma(pasta: PastaLida, conhecidos: Set<string>): SemProcesso[] {
  const porChave = new Map<string, SemProcesso>()
  for (const v of [...pasta.versoes, ...pasta.semBpm, ...pasta.duplicados]) {
    if (conhecidos.has(v.chave)) continue
    const atual = porChave.get(v.chave) ?? { chave: v.chave, sigla: v.sigla, nomeDoProcesso: v.nomeDoProcesso, rotulos: [] }
    if (!atual.rotulos.includes(v.rotulo)) atual.rotulos.push(v.rotulo)
    porChave.set(v.chave, atual)
  }
  return [...porChave.values()]
}

export function montarPreviaDaPasta(pasta: PastaLida, existentes: ProcessoDaPasta[], planilha: PlanilhaLida): PreviaDaPasta {
  const conhecidos = new Set(existentes.map((p) => p.chave))
  const porProcesso = existentes.map((p) => processoNaPrevia(p, pasta)).filter((p) => p.entram.length + p.puladas.length > 0)
  const entram = porProcesso.flatMap((p) => p.entram)
  const arquivosDasVersoes = entram.reduce((soma, v) => soma + arquivosDaVersao(v), 0)
  const totalDePdfsQueFaltam = porProcesso.reduce((soma, p) => soma + p.pdfsQueFaltam.length, 0)
  return {
    porProcesso, semProcesso: semProcessoNaPlataforma(pasta, conhecidos), pasta, lacunas: lacunasDaPasta(pasta, planilha),
    totalDeVersoes: entram.length, arquivosDasVersoes, totalDePdfsQueFaltam, totalDeArquivos: arquivosDasVersoes + totalDePdfsQueFaltam,
    totalDePuladas: porProcesso.reduce((soma, p) => soma + p.puladas.length, 0),
  }
}
