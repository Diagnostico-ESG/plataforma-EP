export type StatusDaEtapa = 'pendente' | 'em_andamento' | 'concluida' | 'realizada_anteriormente' | 'dispensada'

/** Uma etapa do catálogo num setor (o andamento): o id é o do andamento, que as ações recebem. */
export type EtapaDoSetor = {
  id: string
  codigo: string
  nome: string
  ordem: number
  obrigatoria: boolean
  status: StatusDaEtapa
  nota: string | null
  iniciadaEm: string | null
  resolvidaEm: string | null
}

/**
 * Único ponto por onde a interface fala com o banco em processos e etapas. Recusa do banco chega como TravaDoBanco,
 * com a frase pronta; outra falha, como Error cuja mensagem é o motivo em português;
 * etapa de um setor que já não existe, como CadastroInexistente.
 */
export type ModuloDeProcessos = {
  /** Na ordem do catálogo. */
  lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]>
  iniciarEtapa(andamentoId: string): Promise<void>
  concluirEtapa(andamentoId: string): Promise<void>
  dispensarEtapa(andamentoId: string, nota: string): Promise<void>
  registrarRealizadaAnteriormente(andamentoId: string, nota: string): Promise<void>
}
