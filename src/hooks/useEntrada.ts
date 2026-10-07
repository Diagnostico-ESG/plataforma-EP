import { useCallback, useEffect, useState } from 'react'
import { conferirAcesso } from '../acesso/conferirAcesso'
import type { EstadoDaEntrada, ModuloDeAcesso } from '../acesso/tipos'

const FALHA: EstadoDaEntrada = { tipo: 'falha' }

export function useEntrada(acesso: ModuloDeAcesso) {
  const [estado, setEstado] = useState<EstadoDaEntrada>({ tipo: 'verificando' })

  // O estado só muda quando a conferência responde (o inicial já é "verificando").
  const conferir = useCallback(() => {
    conferirAcesso(acesso).then(setEstado, () => setEstado(FALHA))
  }, [acesso])

  useEffect(conferir, [conferir])

  const tentarDeNovo = useCallback(() => {
    setEstado({ tipo: 'verificando' })
    conferir()
  }, [conferir])

  const entrar = useCallback(() => {
    acesso.entrarComGoogle().catch(() => setEstado(FALHA))
  }, [acesso])

  const sair = useCallback(async () => {
    await acesso.sair()
    setEstado({ tipo: 'fora', recusa: null })
  }, [acesso])

  return { estado, entrar, sair, tentarDeNovo }
}
