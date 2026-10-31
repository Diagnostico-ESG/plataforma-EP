import type { NomeIcone } from '../Icone'

/** Processos é a área do Quadro e da Lista; Painel e Ajuda têm por enquanto só a tela "Em breve". */
export type AreaDoSistema = 'processos' | 'setores' | 'painel' | 'administracao' | 'ajuda'

export const ICONE_DA_AREA: Record<AreaDoSistema, NomeIcone> = {
  processos: 'quadro', setores: 'setores', painel: 'painel', administracao: 'administracao', ajuda: 'ajuda',
}
