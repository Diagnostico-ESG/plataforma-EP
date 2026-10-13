import { useCallback, useEffect, useState } from 'react'

// O endereço (#/area/aba) guarda onde a pessoa está, para sobreviver ao recarregar a página.
export function useEndereco(): [string, (novo: string) => void] {
  const [endereco, setEndereco] = useState(() => window.location.hash)

  useEffect(() => {
    const aoMudarEndereco = () => setEndereco(window.location.hash)
    window.addEventListener('hashchange', aoMudarEndereco)
    return () => window.removeEventListener('hashchange', aoMudarEndereco)
  }, [])

  const irPara = useCallback((novo: string) => {
    setEndereco(novo)
    window.location.hash = novo
  }, [])

  return [endereco, irPara]
}
