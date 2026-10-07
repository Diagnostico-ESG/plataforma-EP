import type { Perfil } from './tipos'

const ROTULO_DO_PERFIL: Record<Perfil, string> = {
  administrador: 'Administrador',
  integrante_ep: 'Integrante do EP',
  consulta: 'Consulta',
}

export const PERFIS: readonly Perfil[] = ['administrador', 'integrante_ep', 'consulta']

export function rotuloDoPerfil(perfil: Perfil): string {
  return ROTULO_DO_PERFIL[perfil]
}
