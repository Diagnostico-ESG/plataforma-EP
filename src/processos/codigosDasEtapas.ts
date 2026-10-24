// Os códigos das etapas que a tela reconhece pelo nome: as duas fixas do catálogo (Andamento livre) e as que têm
// campos próprios. Sem dependências, para quem os lê não importar um ao outro em círculo.
export const CODIGO_NAO_INICIADOS = 'nao_iniciados'
export const CODIGO_CONCLUIDOS = 'concluidos'
export const CODIGO_DA_REVISAO_INTERNA = 'revisao_interna'
export const CODIGO_DA_APROVACAO = 'aprovacao_setor'

/** Não iniciados e Concluídos: o tempo ali não é atraso, e a etapa não se muda no catálogo. */
export function ehEtapaFixa(codigo: string): boolean {
  return codigo === CODIGO_NAO_INICIADOS || codigo === CODIGO_CONCLUIDOS
}
