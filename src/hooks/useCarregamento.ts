import { useCallback, useEffect, useState } from 'react'

export type EstadoDoCarregamento<T> = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronto'; valor: T }

/** Carrega ao montar; "tentar de novo" volta a mostrar o carregando, "recarregar" troca o conteúdo sem piscar. */
export function useCarregamento<T>(carregar: () => Promise<T>) {
  const [estado, setEstado] = useState<EstadoDoCarregamento<T>>({ tipo: 'carregando' })

  // O estado só muda quando a leitura responde (o inicial já é "carregando").
  const recarregar = useCallback(() => {
    carregar().then((valor) => setEstado({ tipo: 'pronto', valor }), () => setEstado({ tipo: 'erro' }))
  }, [carregar])

  useEffect(recarregar, [recarregar])

  const tentarDeNovo = useCallback(() => {
    setEstado({ tipo: 'carregando' })
    recarregar()
  }, [recarregar])

  return { estado, tentarDeNovo, recarregar }
}
