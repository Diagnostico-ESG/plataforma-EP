import type { LinhaDaLista } from './tipos'
import { ROTULO_DO_TIPO } from './rotulos'
import type { SituacaoDoProcesso } from './tipos'

export type ColunaDaLista = 'processo' | 'tipo' | 'setor' | 'macroprocesso' | 'etapa' | 'responsavel' | 'situacao'
export type SentidoDaOrdem = 'crescente' | 'decrescente'
export type OrdenacaoDaLista = { coluna: ColunaDaLista; sentido: SentidoDaOrdem }

export const ORDENACAO_PADRAO: OrdenacaoDaLista = { coluna: 'processo', sentido: 'crescente' }

// Em andamento, suspenso, concluído (spec, "Lista: cabeçalhos"); o cancelado fica no fim, no bloco dele.
const ORDEM_DA_SITUACAO: Record<SituacaoDoProcesso, number> = { em_andamento: 0, suspenso: 1, concluido: 2, cancelado: 3 }

type Chave = string | number | null

// A chave de cada coluna; null é o vazio (sem etapa, sem responsável), que fica no fim nos dois sentidos, como numa planilha.
const CHAVES: Record<ColunaDaLista, (linha: LinhaDaLista) => Chave> = {
  processo: (linha) => linha.nome,
  tipo: (linha) => ROTULO_DO_TIPO[linha.tipo],
  setor: (linha) => linha.setorSigla,
  macroprocesso: (linha) => linha.macroprocessoNome,
  etapa: (linha) => linha.etapaAtual?.ordem ?? null,
  responsavel: (linha) => linha.responsavel?.nome ?? null,
  situacao: (linha) => ORDEM_DA_SITUACAO[linha.situacao],
}

const compararTexto = (a: string, b: string): number => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })

function compararChaves(a: Chave, b: Chave): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return compararTexto(String(a), String(b))
}

function comparador({ coluna, sentido }: OrdenacaoDaLista) {
  const sinal = sentido === 'crescente' ? 1 : -1
  return (a: LinhaDaLista, b: LinhaDaLista): number => {
    const [chaveA, chaveB] = [CHAVES[coluna](a), CHAVES[coluna](b)]
    if (chaveA === null || chaveB === null) return Number(chaveA === null) - Number(chaveB === null) || compararTexto(a.nome, b.nome)
    return sinal * compararChaves(chaveA, chaveB) || compararTexto(a.nome, b.nome)
  }
}

/** Ordena pela coluna escolhida; cada subprocesso vem logo depois do pai, quando o pai está nas linhas. */
export function ordenarLinhas(linhas: LinhaDaLista[], ordenacao: OrdenacaoDaLista): LinhaDaLista[] {
  const ordenadas = [...linhas].sort(comparador(ordenacao))
  const ids = new Set(linhas.map((linha) => linha.id))
  const temPaiNaLista = (linha: LinhaDaLista) => linha.processoPaiId !== null && ids.has(linha.processoPaiId)
  const filhosDe = (id: string) => ordenadas.filter((linha) => linha.processoPaiId === id && temPaiNaLista(linha))
  const comFilhos = (linha: LinhaDaLista): LinhaDaLista[] => [linha, ...filhosDe(linha.id).flatMap(comFilhos)]
  return ordenadas.filter((linha) => !temPaiNaLista(linha)).flatMap(comFilhos)
}
