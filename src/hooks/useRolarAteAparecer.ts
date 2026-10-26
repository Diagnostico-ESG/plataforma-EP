import { useEffect, useRef } from 'react'

/**
 * O formulário que abre abaixo da dobra rola até aparecer inteiro (ou o máximo que a janela comporta). O jsdom dos testes
 * não tem `scrollIntoView`: sem ele, não rola.
 */
export function useRolarAteAparecer<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [])
  return ref
}
