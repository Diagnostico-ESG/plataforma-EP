import { useCallback, useEffect, useState } from 'react'
import type { LinhaDeUsuario, ModuloDeAcesso } from '../acesso/tipos'

export type EstadoDaLista = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronta'; linhas: LinhaDeUsuario[] }

export function useUsuarios(acesso: ModuloDeAcesso) {
  const [lista, setLista] = useState<EstadoDaLista>({ tipo: 'carregando' })

  // O estado só muda quando a lista responde (o inicial já é "carregando").
  const carregar = useCallback(() => {
    acesso.listarUsuarios().then((linhas) => setLista({ tipo: 'pronta', linhas }), () => setLista({ tipo: 'erro' }))
  }, [acesso])

  useEffect(carregar, [carregar])

  const tentarDeNovo = useCallback(() => {
    setLista({ tipo: 'carregando' })
    carregar()
  }, [carregar])

  // Depois de gravar, relê a lista: quem diz como ela ficou é o banco. A falha segue para quem chamou.
  const gravar = useCallback(async (alteracao: () => Promise<void>) => {
    await alteracao()
    carregar()
  }, [carregar])

  return { lista, tentarDeNovo, gravar }
}
