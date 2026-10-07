import { useCallback, useEffect, useState } from 'react'
import type { AreaComTela } from '../components/moldura/areas'

// A área fica no endereço (#/administracao) para sobreviver ao recarregar a página.
function areaDoEndereco(): AreaComTela {
  return window.location.hash === '#/administracao' ? 'administracao' : 'quadro'
}

export function useAreaAtual(): [AreaComTela, (area: AreaComTela) => void] {
  const [area, setArea] = useState(areaDoEndereco)

  useEffect(() => {
    const aoMudarEndereco = () => setArea(areaDoEndereco())
    window.addEventListener('hashchange', aoMudarEndereco)
    return () => window.removeEventListener('hashchange', aoMudarEndereco)
  }, [])

  const irPara = useCallback((nova: AreaComTela) => {
    setArea(nova)
    window.location.hash = `#/${nova}`
  }, [])

  return [area, irPara]
}
