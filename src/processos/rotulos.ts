import type { EtiquetaDaEtapa, SituacaoDoProcesso, TipoDeProcesso } from './tipos'

export const ROTULO_DO_TIPO: Record<TipoDeProcesso, string> = {
  processo: 'Processo', subprocesso: 'Subprocesso', a_classificar: 'A classificar',
}

export const ROTULO_DA_SITUACAO: Record<SituacaoDoProcesso, string> = {
  em_andamento: 'Em andamento', suspenso: 'Suspenso', cancelado: 'Cancelado', concluido: 'Concluído',
}

// O valor guardado segue "concluido"; "Finalizado" evita confundir a etiqueta com a etapa Concluídos (ADR 0031).
export const ROTULO_DA_ETIQUETA: Record<EtiquetaDaEtapa, string> = {
  a_fazer: 'A fazer', em_andamento: 'Iniciado', concluido: 'Finalizado',
}

/** Na ordem em que a lista do Agora as oferece. */
export const ETIQUETAS: EtiquetaDaEtapa[] = ['a_fazer', 'em_andamento', 'concluido']
