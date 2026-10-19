import { type RefObject, useEffect } from 'react'

// pointerdown (e não click): fecha antes de o clique fora acionar outra coisa por baixo do painel.
// O ouvinte é refeito a cada renderização com o menu aberto (fechar muda); com o menu, isso é raro e barato.
export function useFecharAoClicarFora(menu: RefObject<HTMLElement | null>, aberto: boolean, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return
    const aoApertar = (evento: PointerEvent) => {
      if (!menu.current?.contains(evento.target as Node)) fechar()
    }
    document.addEventListener('pointerdown', aoApertar)
    return () => document.removeEventListener('pointerdown', aoApertar)
  }, [menu, aberto, fechar])
}
