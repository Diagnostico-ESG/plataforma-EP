export type AreaDoSistema = 'quadro' | 'lista' | 'setores' | 'reunioes' | 'painel' | 'administracao'
// As demais áreas ganham tela na sua funcionalidade; até lá o botão delas não faz nada.
export type AreaComTela = Extract<AreaDoSistema, 'quadro' | 'setores' | 'administracao'>

export function temTela(area: AreaDoSistema): area is AreaComTela {
  return area === 'quadro' || area === 'setores' || area === 'administracao'
}
