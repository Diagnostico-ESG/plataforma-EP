import { useEffect, useState } from 'react'
import { type ResumoDaPasta, enviarPasta } from '../importacao/enviarPasta'
import { lerArquivoDaPlanilha } from '../importacao/executarImportacao'
import { fraseDaFalhaDeLeitura, frasesDaRecusa } from '../importacao/frasesDaImportacao'
import { type ArquivoDaPasta, lerPasta } from '../importacao/lerPasta'
import type { PlanilhaLida } from '../importacao/lerPlanilha'
import { type PreviaDaPasta, montarPreviaDaPasta } from '../importacao/previaDaPasta'
import type { ModuloDeImportacao } from '../importacao/tipos'

export type FaseDaPasta =
  | { tipo: 'carregando' }
  | { tipo: 'fechada' }
  | { tipo: 'escolher'; recusa: string | null }
  | { tipo: 'lendo' }
  | { tipo: 'previa'; previa: PreviaDaPasta }
  | { tipo: 'enviando'; feitos: number; total: number }
  | { tipo: 'resumo'; resumo: ResumoDaPasta }

export type EscolhaDaPasta = { pasta: ArquivoDaPasta[] | null; planilha: File | null }

/** O caminho do arquivo dentro da pasta escolhida; no navegador sem `webkitRelativePath`, só o nome. */
export function arquivosDaPasta(arquivos: File[]): ArquivoDaPasta[] {
  return arquivos.map((arquivo) => ({ arquivo, caminho: arquivo.webkitRelativePath || arquivo.name }))
}

// A prévia lê de novo o que a plataforma tem: na segunda rodada, as versões que entraram já aparecem como puladas.
async function montar(importacao: ModuloDeImportacao, pasta: ArquivoDaPasta[], planilha: File): Promise<FaseDaPasta> {
  let lida: PlanilhaLida
  try {
    lida = await lerArquivoDaPlanilha(planilha, new Date())
  } catch (erro) {
    return { tipo: 'escolher', recusa: frasesDaRecusa(erro) }
  }
  try {
    const { processos } = await importacao.listarProcessosDaPasta()
    return { tipo: 'previa', previa: montarPreviaDaPasta(lerPasta(pasta), processos, lida) }
  } catch (erro) {
    return { tipo: 'escolher', recusa: fraseDaFalhaDeLeitura(erro) }
  }
}

/**
 * Os passos da segunda entrega: escolher a pasta e o .csv da planilha, ver a prévia, enviar e ver o resumo. Fechada enquanto a
 * planilha não foi importada. Nada é enviado antes de confirmar.
 */
export function useImportacaoDaPasta(importacao: ModuloDeImportacao) {
  const [fase, setFase] = useState<FaseDaPasta>({ tipo: 'carregando' })
  const [escolha, setEscolha] = useState<EscolhaDaPasta>({ pasta: null, planilha: null })

  useEffect(() => {
    let ativo = true
    importacao.listarProcessosDaPasta()
      .then(({ haImportado }) => { if (ativo) setFase(haImportado ? { tipo: 'escolher', recusa: null } : { tipo: 'fechada' }) })
      .catch((erro: unknown) => { if (ativo) setFase({ tipo: 'escolher', recusa: fraseDaFalhaDeLeitura(erro) }) })
    return () => { ativo = false }
  }, [importacao])

  async function escolher(mudanca: Partial<EscolhaDaPasta>) {
    const nova = { ...escolha, ...mudanca }
    setEscolha(nova)
    if (!nova.pasta || !nova.planilha) return
    setFase({ tipo: 'lendo' })
    setFase(await montar(importacao, nova.pasta, nova.planilha))
  }

  async function enviar() {
    if (fase.tipo !== 'previa') return
    const { previa } = fase
    setFase({ tipo: 'enviando', feitos: 0, total: previa.totalDeArquivos })
    const resumo = await enviarPasta(importacao, previa, (feitos, total) => setFase({ tipo: 'enviando', feitos, total }))
    setFase({ tipo: 'resumo', resumo })
  }

  function recomecar() {
    setEscolha({ pasta: null, planilha: null })
    setFase({ tipo: 'escolher', recusa: null })
  }

  return { fase, escolha, escolher, enviar, recomecar }
}
