import { useState } from 'react'

/**
 * A gravação que a janela de concluir espera (Revisão interna e Aprovação): enquanto grava, `salvando`; a frase devolvida
 * pela gravação é a falha (a janela fica aberta, com o preenchido); null é gravado, e a janela fecha.
 */
export function useGravacaoNaJanela(aoFechar: () => void) {
  const [salvando, setSalvando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  async function gravar(gravacao: () => Promise<string | null>) {
    setSalvando(true)
    setFalha(null)
    const falhou = await gravacao()
    setSalvando(false)
    if (falhou) setFalha(falhou)
    else aoFechar()
  }

  return { salvando, falha, gravar }
}
