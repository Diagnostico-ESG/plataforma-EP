import { useState } from 'react'
import { textoDaFalhaDaRetirada } from '../anexos/recusasDeAnexos'
import type { Anexo, ModuloDeAnexos } from '../anexos/tipos'

/**
 * A retirada de anexo (ADR 0027): guarda o anexo à espera da confirmação, retira, guarda a falha para a tela mostrar e, ao fim
 * (deu certo ou não), manda ler a lista de novo, para ela refletir o que o servidor tem (o anexo "já retirado" em outra aba
 * some da lista, e o que falhou continua nela).
 */
export function useRetiradaDeAnexo(modulo: ModuloDeAnexos, aoTerminar: () => void) {
  const [aConfirmar, setAConfirmar] = useState<Anexo | null>(null)
  const [falha, setFalha] = useState<string | null>(null)

  async function confirmar() {
    if (!aConfirmar) return
    setFalha(null)
    try {
      await modulo.retirarAnexo(aConfirmar.id)
    } catch (erro) {
      setFalha(textoDaFalhaDaRetirada(erro))
    }
    aoTerminar()
  }

  return { aConfirmar, falha, pedir: setAConfirmar, cancelar: () => setAConfirmar(null), confirmar }
}
