import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import type { EtapaNoCatalogo, ResponsavelInicialDaEtapa } from './tipos'

export type SituacaoDoResponsavelInicial = 'valido' | 'inativo' | 'sem_permissao'

/** Como o banco decide: ativo e Administrador ou Integrante do EP. Inativo vem primeiro, para a marca dizer o motivo mais forte. */
export function situacaoDoResponsavelInicial({ ativo, perfil }: ResponsavelInicialDaEtapa): SituacaoDoResponsavelInicial {
  if (!ativo) return 'inativo'
  return perfil === 'administrador' || perfil === 'integrante_ep' ? 'valido' : 'sem_permissao'
}

/** Como responsavel_inicial_valido do banco: quem chega à etapa fica com ele se ainda vale; Concluídos nunca tem. */
export function responsavelInicialValido({ codigo, responsavelInicial }: Pick<EtapaNoCatalogo, 'codigo' | 'responsavelInicial'>): ResponsavelInicialDaEtapa | null {
  if (codigo === CODIGO_CONCLUIDOS || !responsavelInicial) return null
  return situacaoDoResponsavelInicial(responsavelInicial) === 'valido' ? responsavelInicial : null
}
