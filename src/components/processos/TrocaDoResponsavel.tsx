import { useEffect, useRef, useState } from 'react'
import type { OpcaoDeResponsavel } from '../../processos/agoraDoProcesso'

type TrocaDoResponsavelProps = {
  /** O responsável de agora (null: ninguém); a lista mostra sempre o valor vindo daqui. */
  responsavelId: string | null
  opcoes: OpcaoDeResponsavel[]
  desabilitada: boolean
  /** Grava ao escolher, sem confirmação; null é "Ninguém por enquanto". */
  aoEscolher: (usuarioId: string | null) => void
}

/**
 * O link "Trocar": abre a lista suspensa do responsável do processo. Escolher grava e fecha; Esc fecha só a lista.
 * O valor mostrado vem sempre do processo, então uma gravação que falha deixa o responsável como estava.
 */
export function TrocaDoResponsavel({ responsavelId, opcoes, desabilitada, aoEscolher }: TrocaDoResponsavelProps) {
  const [trocando, setTrocando] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLSelectElement>(null)
  const jaAbriu = useRef(false)

  // O foco acompanha a troca: vai à lista ao abrir e volta ao link ao fechar, para o teclado não se perder.
  useEffect(() => {
    if (trocando) {
      jaAbriu.current = true
      lista.current?.focus()
    } else if (jaAbriu.current) botao.current?.focus()
  }, [trocando])

  if (!trocando) {
    return (
      <button ref={botao} type="button" className="agora-trocar" aria-label="Trocar o responsável" disabled={desabilitada}
        onClick={() => setTrocando(true)}>
        Trocar
      </button>
    )
  }
  return (
    <select ref={lista} className="agora-lista" aria-label="Responsável" value={responsavelId ?? ''} disabled={desabilitada}
      onChange={(mudanca) => {
        setTrocando(false)
        aoEscolher(mudanca.target.value === '' ? null : mudanca.target.value)
      }}
      onKeyDown={(tecla) => {
        if (tecla.key !== 'Escape') return
        // Esc é da lista: sem impedir, a janela do verso por trás fecharia junto.
        tecla.preventDefault()
        tecla.stopPropagation()
        setTrocando(false)
      }}>
      {opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor} disabled={opcao.desabilitada}>{opcao.rotulo}</option>)}
    </select>
  )
}
