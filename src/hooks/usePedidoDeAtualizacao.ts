import { useState } from 'react'
import { frasePedidoRecusado } from '../planilhas/frasesDasPlanilhas'
import type { ModuloDePlanilhas } from '../planilhas/tipos'

/**
 * O pedido do botão [Atualizar planilhas agora]. Termina sempre relendo a lista: no sucesso ela mostra a tentativa
 * "Em andamento"; na recusa (outra pessoa pediu antes), mostra a que já está em andamento.
 */
export function usePedidoDeAtualizacao(planilhas: ModuloDePlanilhas, aoTerminar: () => void) {
  const [pedindo, setPedindo] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  async function pedir() {
    setPedindo(true)
    setFalha(null)
    try {
      await planilhas.pedirAtualizacao()
    } catch (erro) {
      setFalha(frasePedidoRecusado(erro))
    }
    setPedindo(false)
    aoTerminar()
  }

  return { pedindo, falha, pedir }
}
