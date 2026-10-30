import type { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ResponsavelInicialDaEtapa } from '../processos/tipos'

/** Dá a uma etapa o responsável inicial, como o Administrador faria no Catálogo; parte das etapas do Quadro quando o catálogo do falso ainda está vazio. */
export function comResponsavelInicial(falso: ProcessosFalso, codigo: string, responsavel: ResponsavelInicialDaEtapa | null): void {
  const base = falso.catalogo.etapas.length > 0 ? falso.catalogo.etapas : falso.etapasDoCatalogo.map((etapa) => ({ ...etapa, fase: null }))
  falso.catalogo.etapas = base.map((etapa) => (etapa.codigo === codigo ? { ...etapa, responsavelInicial: responsavel } : etapa))
}
