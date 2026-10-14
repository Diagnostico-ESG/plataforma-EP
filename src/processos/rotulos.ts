import type { OrigemDoProcesso, SituacaoDoProcesso, TipoDeProcesso } from './tipos'

export const ROTULO_DO_TIPO: Record<TipoDeProcesso, string> = {
  processo: 'Processo', subprocesso: 'Subprocesso', a_classificar: 'A classificar',
}

export const ROTULO_DA_ORIGEM: Record<OrigemDoProcesso, string> = { novo: 'Novo', retomado: 'Retomado' }

export const ROTULO_DA_SITUACAO: Record<SituacaoDoProcesso, string> = {
  em_andamento: 'Em andamento', suspenso: 'Suspenso', cancelado: 'Cancelado', concluido: 'Concluído',
}
