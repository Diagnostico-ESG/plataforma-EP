export type TipoDeReuniao = 'sensibilizacao' | 'modelagem'

/** Um processo tratado na reunião; "cancelado" é o que, num processo, equivale a inativo. */
export type ProcessoDaReuniao = { id: string; nome: string; cancelado: boolean }

/** Data é AAAA-MM-DD e hora é HH:MM, como o banco as devolve; a hora é opcional. */
export type Reuniao = {
  id: string
  tipo: TipoDeReuniao
  setorId: string
  setorSigla: string
  setorAtivo: boolean
  data: string
  hora: string | null
  local: string | null
  anotacoes: string | null
  /** Só na modelagem; por nome. */
  processos: ProcessoDaReuniao[]
}

/** O que o formulário grava. Os participantes entram no ticket 03. */
export type DadosDaReuniao = {
  tipo: TipoDeReuniao
  setorId: string
  data: string
  hora: string | null
  local: string | null
  anotacoes: string | null
  processosIds: string[]
}

export type SetorParaReuniao = { id: string; sigla: string; nome: string }

/**
 * Único ponto por onde a interface fala com o banco nas reuniões. Recusa do banco chega como TravaDoBanco,
 * com a frase pronta; outra falha de gravação, como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeReunioes = {
  /** Todas as reuniões, sem ordem fixa: a tela ordena pela data. */
  listarReunioes(): Promise<Reuniao[]>
  /** null: a reunião não existe (mais). */
  lerReuniao(id: string): Promise<Reuniao | null>
  /** Só os setores ativos, por sigla. */
  listarSetoresAtivos(): Promise<SetorParaReuniao[]>
  /** Processos e subprocessos do setor, em qualquer situação, por nome. */
  listarProcessosDoSetor(setorId: string): Promise<ProcessoDaReuniao[]>
  /** id nulo cria a reunião; senão altera a existente. */
  salvarReuniao(id: string | null, dados: DadosDaReuniao): Promise<void>
}
