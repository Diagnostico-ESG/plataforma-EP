import { useState } from 'react'

type Saida = { falhaAoSair: boolean; saindo: boolean; tentarSair: () => void; esquecerFalha: () => void }

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
  // Ao fechar o menu, a falha já foi lida; reabri-lo com a mensagem antiga daria a entender uma falha nova.
  const esquecerFalha = () => setFalhaAoSair(false)
  return { falhaAoSair, saindo, tentarSair, esquecerFalha }
}
