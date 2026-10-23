import { useEffect, useReducer, useState } from 'react'
import { GravadorDeAnotacoes } from '../processos/GravadorDeAnotacoes'
import type { AnotacoesLidas, ModuloDeProcessos } from '../processos/tipos'

/**
 * Liga o gravador das Anotações do processo à tela: o componente relê o gravador a cada aviso dele e, enquanto houver
 * texto não gravado, o navegador pergunta antes de fechar a aba ou recarregar (spec, "Verso do cartão", Anotações).
 */
export function useAnotacoesDoProcesso(
  processos: ModuloDeProcessos, id: string, inicial: AnotacoesLidas, aoSumir: () => void,
): GravadorDeAnotacoes {
  const [, reler] = useReducer((vez: number) => vez + 1, 0)
  const [gravador] = useState(() => new GravadorDeAnotacoes(inicial, {
    gravar: (esperado, novo) => processos.gravarAnotacoes(id, esperado, novo),
    ler: () => processos.lerAnotacoes(id),
    aoSumir,
  }))

  useEffect(() => {
    const parar = gravador.ouvir(reler)
    return () => {
      parar()
      gravador.encerrar()
    }
  }, [gravador])

  useEffect(() => {
    const perguntar = (evento: BeforeUnloadEvent) => {
      if (!gravador.pendente()) return
      evento.preventDefault()
      evento.returnValue = '' // o Chrome antigo só pergunta com isto
    }
    window.addEventListener('beforeunload', perguntar)
    return () => window.removeEventListener('beforeunload', perguntar)
  }, [gravador])

  return gravador
}
