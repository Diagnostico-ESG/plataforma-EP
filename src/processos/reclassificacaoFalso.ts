import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_DO_PAI, fraseDeTipoInvalido, fraseDosSubprocessos } from './frasesDeReclassificacao'
import type { ProcessoLido, Reclassificacao, TipoDeProcesso } from './tipos'

type Estrutura = Pick<ProcessoLido, 'processoPai' | 'subprocessos'>

// As mudanças de tipo da spec (Regras de estado, Reclassificação), como a função do banco as confere.
const DESTINOS: Record<TipoDeProcesso, TipoDeProcesso[]> = {
  a_classificar: ['processo', 'subprocesso'], processo: ['subprocesso'], subprocesso: ['processo'],
}

/** O pai e os subprocessos (por nome), calculados da lista como o banco os lê. */
export function estruturaDoProcesso(processos: ProcessoLido[], processo: ProcessoLido): Estrutura {
  const pai = processos.find((outro) => outro.id === processo.processoPaiId)
  const filhos = processos.filter((outro) => outro.processoPaiId === processo.id)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return {
    processoPai: pai ? { id: pai.id, nome: pai.nome } : null,
    subprocessos: filhos.map(({ id, nome }) => ({ id, nome })),
  }
}

/** Como o gatilho do banco: o pai existe, é do tipo Processo e não é o próprio item. */
export function conferirPai(processos: ProcessoLido[], paiId: string | null, idDoProprio?: string): ProcessoLido {
  const pai = processos.find((outro) => outro.id === paiId)
  if (!pai || pai.tipo !== 'processo' || pai.id === idDoProprio) throw new TravaDoBanco(FRASE_DO_PAI)
  return pai
}

/** Processo com subprocessos não se exclui nem vira subprocesso: a recusa traz a contagem. */
export function conferirSemSubprocessos(processos: ProcessoLido[], id: string): void {
  const total = processos.filter((outro) => outro.processoPaiId === id).length
  if (total > 0) throw new TravaDoBanco(fraseDosSubprocessos(total))
}

/** O mesmo item com o tipo novo: ao virar subprocesso, o pai e o macroprocesso dele; ao virar processo, sem pai. */
export function reclassificar(
  processos: ProcessoLido[], processo: ProcessoLido, { tipo, processoPaiId }: Reclassificacao, motivo: string,
): ProcessoLido {
  if (motivo.trim() === '') throw new TravaDoBanco('O motivo é obrigatório.')
  if (!DESTINOS[processo.tipo].includes(tipo)) throw new TravaDoBanco(fraseDeTipoInvalido(processo.tipo, tipo))
  if (tipo === 'processo') return { ...processo, tipo, processoPaiId: null }
  conferirSemSubprocessos(processos, processo.id)
  const pai = conferirPai(processos, processoPaiId, processo.id)
  return { ...processo, tipo, processoPaiId: pai.id, ...macroprocessoDo(pai) }
}

/** Mudar o macroprocesso do pai leva os filhos junto. */
export function levarMacroprocessoAosFilhos(processos: ProcessoLido[], pai: ProcessoLido): ProcessoLido[] {
  return processos.map((outro) => (outro.processoPaiId === pai.id ? { ...outro, ...macroprocessoDo(pai) } : outro))
}

export function macroprocessoDo(pai: ProcessoLido): Pick<ProcessoLido, 'macroprocessoId' | 'macroprocessoNome'> {
  return { macroprocessoId: pai.macroprocessoId, macroprocessoNome: pai.macroprocessoNome }
}
