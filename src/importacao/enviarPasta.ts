// O envio da importação dos arquivos (ticket 02): versão a versão, processo a processo. A falha de uma versão fica listada e
// as outras seguem (história 53); a próxima rodada envia de novo só o que não entrou, porque a prévia pula o que já existe.
import type { VersaoDaPasta } from './lerPasta'
import { type PreviaDaPasta, type ProcessoNaPrevia, arquivosDaVersao } from './previaDaPasta'
import type { ModuloDeImportacao, PedidoDeImportacaoDeVersao } from './tipos'

export type ResumoDaPasta = { criadas: number; puladas: number; falhas: string[]; previa: PreviaDaPasta }

type Envio = {
  importacao: ModuloDeImportacao
  resumo: ResumoDaPasta
  /** Arquivos já tratados (enviados ou com falha), para o andamento "N de M". */
  feitos: number
  aoAndar: (feitos: number, total: number) => void
}

function motivo(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

// A falha vira uma linha do resumo, com o processo e o rótulo, e o envio segue.
async function tentar<T>(envio: Envio, onde: string, passo: () => Promise<T>): Promise<T | null> {
  try {
    return await passo()
  } catch (erro) {
    envio.resumo.falhas.push(`${onde}: ${motivo(erro)}`)
    return null
  }
}

function pedidoDa(versao: VersaoDaPasta, processoId: string, numeroDoRelatorio: number | null): PedidoDeImportacaoDeVersao {
  const opcionais = [
    versao.png && { papel: 'png' as const, arquivo: versao.png },
    versao.relatorio && { papel: 'relatorio' as const, arquivo: versao.relatorio },
  ].filter((escolhido) => escolhido !== null)
  return {
    processoId, numero: versao.numero, tipo: versao.tipo, numeroDoRelatorio,
    arquivos: [{ papel: 'bpm', arquivo: versao.bpm }, ...opcionais],
  }
}

// O relatório numerado leva o próximo número do processo; só conta quando a versão entra (o banco dá o número na gravação).
async function enviarVersao(envio: Envio, item: ProcessoNaPrevia, versao: VersaoDaPasta, relatorio: { maior: number }): Promise<void> {
  const { id, nome } = item.processo
  const numerado = versao.relatorio !== null && versao.tipo !== 'historica' ? relatorio.maior + 1 : null
  const total = envio.resumo.previa.totalDeArquivos
  const antes = envio.feitos
  const andar = (enviados: number) => envio.aoAndar(antes + enviados, total)
  const resultado = await tentar(envio, `${nome} ${versao.rotulo}`, () => envio.importacao.importarVersao(pedidoDa(versao, id, numerado), andar))
  envio.feitos = antes + arquivosDaVersao(versao)
  if (resultado === 'criada') envio.resumo.criadas += 1
  if (resultado === 'criada' && numerado !== null) relatorio.maior = numerado
  if (resultado === 'ja_existia') envio.resumo.puladas += 1
  const pdf = versao.pdfDoRelatorio
  if (resultado && pdf) await tentar(envio, `${nome} ${versao.rotulo}`, () => envio.importacao.importarAnexo(id, pdf))
  envio.aoAndar(envio.feitos, total)
}

async function enviarProcesso(envio: Envio, item: ProcessoNaPrevia): Promise<void> {
  const { id, nome } = item.processo
  const subpasta = item.subpasta
  if (subpasta) await tentar(envio, nome, () => envio.importacao.anotarSubpasta(id, subpasta))
  const relatorio = { maior: item.processo.maiorRelatorio }
  for (const versao of item.entram) await enviarVersao(envio, item, versao, relatorio)
}

export async function enviarPasta(importacao: ModuloDeImportacao, previa: PreviaDaPasta,
  aoAndar: (feitos: number, total: number) => void): Promise<ResumoDaPasta> {
  const resumo: ResumoDaPasta = { criadas: 0, puladas: previa.totalDePuladas, falhas: [], previa }
  const envio: Envio = { importacao, resumo, feitos: 0, aoAndar }
  for (const item of previa.porProcesso) await enviarProcesso(envio, item)
  return resumo
}
