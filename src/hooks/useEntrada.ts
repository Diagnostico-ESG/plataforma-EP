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

  // Sem rede, o signOut do supabase-js apaga o login do navegador e só depois devolve o erro: aí a pessoa já
  // saiu deste computador. Só quando o login continua guardado a falha sobe (o menu mostra a mensagem).
  const sair = useCallback(async () => {
    try {
      await acesso.sair()
    } catch (erro) {
      if (await acesso.sessaoAtual()) throw erro
    }
    setEstado({ tipo: 'fora', recusa: null })
  }, [acesso])

  return { estado, entrar, sair, tentarDeNovo }
}
