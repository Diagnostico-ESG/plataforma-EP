export type AreaDoSistema = 'quadro' | 'lista' | 'setores' | 'reunioes' | 'painel' | 'administracao'
// As demais áreas ganham tela na sua funcionalidade; até lá o botão delas não faz nada.
export type AreaComTela = Extract<AreaDoSistema, 'quadro' | 'lista' | 'setores' | 'administracao'>

export function temTela(area: AreaDoSistema): area is AreaComTela {
  return area === 'quadro' || area === 'lista' || area === 'setores' || area === 'administracao'
}

/** Quadro e Lista são as duas formas de ver a área de processos. */
export function ehAreaDeProcessos(area: AreaDoSistema): area is 'quadro' | 'lista' {
  return area === 'quadro' || area === 'lista'
}
