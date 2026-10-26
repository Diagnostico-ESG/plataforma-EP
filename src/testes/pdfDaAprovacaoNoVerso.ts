import type { Aprovacao } from '../revisoes/tipos'
import type { Falsos } from './aprovacaoNoVerso'
import { BIA } from './processoNoVerso'

// O que as suítes do .pdf da aprovação repartem: o histórico das versões ligado ao do processo (como o banco grava os eventos
// na mesma tabela) e a aprovação da V8 já registrada, com ou sem o .pdf.

/**
 * Liga a falsa de versões ao processo: sabe a sigla e o nome dele (que dão o nome do .pdf) e grava os eventos (o .pdf enviado e
 * trocado) no histórico do processo.
 */
export function ligarHistoricoDasVersoes({ falso, versoes }: Falsos): void {
  for (const processo of falso.processos) {
    versoes.processos[processo.id] = { sigla: processo.setorSigla, nome: processo.nome, etapa: processo.etapaAtual?.nome ?? null }
  }
  versoes.aoRegistrar = (processoId, evento) => {
    falso.historicoDosProcessos[processoId] = [evento, ...(falso.historicoDosProcessos[processoId] ?? [])]
  }
}

export const APROVADA_V8: Aprovacao = {
  id: 'ap1', versao: 8, numeroEprotocolo: 'PROT-2026-0001', link: null, aprovadaEm: null,
  registradaPor: BIA.nome, registradaEm: '2026-10-12T15:00:00Z',
}

export const PDF_DA_V8 = {
  id: 'pdf1', papel: 'pdf_da_aprovacao' as const, nome: 'TSA_V8_Emitir Ofício_Aprovação.pdf', formato: 'pdf', tamanho: 100,
}

/** A aprovação da V8 registrada e ligada ao processo, com o .pdf protocolado (ou sem ele). */
export function aprovadaComPdf(comPdf: boolean) {
  return (falsos: Falsos) => {
    ligarHistoricoDasVersoes(falsos)
    falsos.revisoes.aprovacoes.p1 = APROVADA_V8
    if (comPdf) falsos.versoes.pdfsDaAprovacao.p1 = { atual: PDF_DA_V8, guardados: [] }
  }
}

export const arquivoPdf = (nome = 'protocolo.pdf', tamanho?: number): File => {
  const arquivo = new File(['conteúdo do pdf'], nome, { type: 'application/pdf' })
  if (tamanho !== undefined) Object.defineProperty(arquivo, 'size', { value: tamanho })
  return arquivo
}
