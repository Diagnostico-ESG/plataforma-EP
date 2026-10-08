import { useCallback } from 'react'
import type { LinhaDeUsuario, ModuloDeAcesso } from '../acesso/tipos'
import { useCarregamento } from './useCarregamento'

export type EstadoDaLista = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronta'; linhas: LinhaDeUsuario[] }

export function useUsuarios(acesso: ModuloDeAcesso, aposGravar: () => void) {
  const listar = useCallback(() => acesso.listarUsuarios(), [acesso])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const lista: EstadoDaLista = estado.tipo === 'pronto' ? { tipo: 'pronta', linhas: estado.valor } : estado

  // Depois de gravar, relê a lista (quem diz como ela ficou é o banco) e avisa quem mais depende dela.
  // A falha segue para quem chamou.
  const gravar = useCallback(async (alteracao: () => Promise<void>) => {
    await alteracao()
    recarregar()
    aposGravar()
  }, [recarregar, aposGravar])

  return { lista, tentarDeNovo, gravar }
}
