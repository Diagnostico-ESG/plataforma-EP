import { useCallback, useEffect, useState } from 'react'

// O endereço (#/area/aba) guarda onde a pessoa está, para sobreviver ao recarregar a página.
export function useEndereco(): [string, (novo: string, substituir?: boolean) => void] {
  const [endereco, setEndereco] = useState(() => window.location.hash)

  useEffect(() => {
    const aoMudarEndereco = () => setEndereco(window.location.hash)
    window.addEventListener('hashchange', aoMudarEndereco)
    return () => window.removeEventListener('hashchange', aoMudarEndereco)
  }, [])

  // "substituir" troca o endereço atual em vez de acrescentar um passo ao histórico (a busca muda a cada tecla; o Voltar não deve andar letra por letra).
  // replaceState não dispara hashchange, por isso o estado é atualizado aqui.
  const irPara = useCallback((novo: string, substituir = false) => {
    setEndereco(novo)
    if (substituir) window.history.replaceState(null, '', novo)
    else window.location.hash = novo
  }, [])

  return [endereco, irPara]
}
