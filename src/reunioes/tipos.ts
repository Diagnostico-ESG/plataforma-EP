import type { EventoDoCadastro } from '../cadastros/tipos'

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
  /** Nomes escritos à mão, um por item; a tela os mostra no ticket de participantes. */
  outrosParticipantes: string[]
  /** Só na modelagem; por nome. */
  processos: ProcessoDaReuniao[]
}

/** O que o formulário grava. Os outros participantes seguem como estavam: quem edita os devolve sem mexer. */
export type DadosDaReuniao = {
  tipo: TipoDeReuniao
  setorId: string
  data: string
  hora: string | null
  local: string | null
  anotacoes: string | null
  processosIds: string[]
  outrosParticipantes: string[]
}

/** `inativo`: o setor da reunião que já existe, mantido na escolha mesmo depois de desativado. */
export type SetorParaReuniao = { id: string; sigla: string; nome: string; inativo?: boolean }

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
  /** Reunião que já não existe: CadastroInexistente; perfil sem permissão: TravaDoBanco. */
  excluirReuniao(id: string): Promise<void>
  /** Os eventos da reunião, do mais recente para o mais antigo. */
  lerHistoricoDaReuniao(id: string): Promise<EventoDoCadastro[]>
}
