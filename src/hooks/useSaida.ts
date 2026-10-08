import { useState } from 'react'

type Saida = { falhaAoSair: boolean; saindo: boolean; tentarSair: () => void }

// Se o Sair falha, a pessoa continua dentro e precisa saber por quê (num computador compartilhado,
// achar que saiu sem ter saído é o pior caso). O botão fica desativado para não sair duas vezes.
export function useSaida(aoSair: () => Promise<void>): Saida {
  const [falhaAoSair, setFalhaAoSair] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const tentarSair = () => {
    setFalhaAoSair(false)
    setSaindo(true)
    aoSair().catch(() => {
      setFalhaAoSair(true)
      setSaindo(false)
    })
  }
  return { falhaAoSair, saindo, tentarSair }
}
