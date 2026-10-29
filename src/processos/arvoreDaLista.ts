import type { LinhaDaLista } from './linhasDaLista'
import type { ProcessoDaLista, SetorDoQuadro } from './tipos'

/** Uma linha da árvore: nível 0 é o processo; 1, o subprocesso recuado sob o pai. */
export type ItemDaArvore = {
  linha: LinhaDaLista
  nivel: number
  /** O nome do pai, só no subprocesso cujo pai não está nas linhas (um filtro o tirou): ele aparece sozinho, com esta indicação. */
  subprocessoDe: string | null
}

export type SetorDaArvore = { id: string; sigla: string; nome: string; cor: number; itens: ItemDaArvore[] }

export type MacroDaArvore = { id: string; nome: string; total: number; setores: SetorDaArvore[] }

const emOrdemDeTexto = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })

/**
 * Agrupa as linhas, já filtradas e ordenadas, em macroprocesso → setor → processo, sem reordenar os processos (a árvore e a
 * tabela usam a mesma ordem). O subprocesso fica sob o pai, mesmo de outro setor; sem o pai nas linhas, fica sob o próprio
 * setor, no macroprocesso do pai (lido de `todos`).
 */
export function montarArvore(linhas: LinhaDaLista[], todos: ProcessoDaLista[], setores: SetorDoQuadro[]): MacroDaArvore[] {
  const naLista = new Set(linhas.map((linha) => linha.id))
  const filhosDe = new Map<string, LinhaDaLista[]>()
  const raizes: LinhaDaLista[] = []
  for (const linha of linhas) {
    const pai = linha.processoPaiId
    if (pai !== null && naLista.has(pai)) filhosDe.set(pai, [...(filhosDe.get(pai) ?? []), linha])
    else raizes.push(linha)
  }
  const porId = new Map(todos.map((processo) => [processo.id, processo]))
  const macros = new Map<string, MacroDaArvore>()
  for (const raiz of raizes) {
    const itens = itensDaRaiz(raiz, filhosDe, 0)
    acrescentar(macros, macroDaRaiz(raiz, porId), raiz, itens, setores)
  }
  return [...macros.values()].sort((a, b) => emOrdemDeTexto(a.nome, b.nome)).map(ordenarSetores)
}

function ordenarSetores(macro: MacroDaArvore): MacroDaArvore {
  return { ...macro, setores: [...macro.setores].sort((a, b) => emOrdemDeTexto(a.sigla, b.sigla)) }
}

function itensDaRaiz(linha: LinhaDaLista, filhosDe: Map<string, LinhaDaLista[]>, nivel: number): ItemDaArvore[] {
  const subprocessoDe = nivel === 0 && linha.processoPaiId !== null ? linha.nomeDoPai : null
  const filhos = (filhosDe.get(linha.id) ?? []).flatMap((filho) => itensDaRaiz(filho, filhosDe, nivel + 1))
  return [{ linha, nivel, subprocessoDe }, ...filhos]
}

// O subprocesso sem pai nas linhas segue o macroprocesso do pai; sem o pai em lugar nenhum, o dele mesmo.
function macroDaRaiz(raiz: LinhaDaLista, porId: Map<string, ProcessoDaLista>): { id: string; nome: string } {
  const dono = (raiz.processoPaiId !== null ? porId.get(raiz.processoPaiId) : undefined) ?? raiz
  return { id: dono.macroprocessoId, nome: dono.macroprocessoNome }
}

function acrescentar(
  macros: Map<string, MacroDaArvore>, { id, nome }: { id: string; nome: string }, raiz: LinhaDaLista, itens: ItemDaArvore[], setores: SetorDoQuadro[],
) {
  const macro = macros.get(id) ?? { id, nome, total: 0, setores: [] }
  macro.total += itens.length
  const setor = macro.setores.find((existente) => existente.id === raiz.setorId) ?? novoSetor(raiz, setores)
  if (!macro.setores.includes(setor)) macro.setores.push(setor)
  setor.itens.push(...itens)
  macros.set(id, macro)
}

function novoSetor(raiz: LinhaDaLista, setores: SetorDoQuadro[]): SetorDaArvore {
  const cadastrado = setores.find((setor) => setor.id === raiz.setorId)
  return { id: raiz.setorId, sigla: raiz.setorSigla, nome: cadastrado?.nome ?? raiz.setorSigla, cor: cadastrado?.cor ?? raiz.setorCor ?? 1, itens: [] }
}
