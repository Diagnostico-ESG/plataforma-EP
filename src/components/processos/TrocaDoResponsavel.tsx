import { useEffect, useRef, useState } from 'react'
import type { OpcaoDeResponsavel } from '../../processos/caminhoDeEtapas'
import type { EtapaDoProcesso } from '../../processos/tipos'

type TrocaDoResponsavelProps = {
  etapa: EtapaDoProcesso
  opcoes: OpcaoDeResponsavel[]
  /** Grava ao escolher, sem confirmação; null é "Ninguém por enquanto". */
  aoEscolher: (usuarioId: string | null) => void
}

/**
 * O link "Trocar": abre a lista suspensa do responsável da etapa. Escolher grava e fecha; Esc fecha só a lista.
 * O valor mostrado vem sempre da etapa, então uma gravação que falha deixa o responsável como estava.
 */
export function TrocaDoResponsavel({ etapa, opcoes, aoEscolher }: TrocaDoResponsavelProps) {
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
      <button ref={botao} type="button" className="agora-trocar" aria-label={`Trocar o responsável de ${etapa.nome}`}
        onClick={() => setTrocando(true)}>
        Trocar
      </button>
    )
  }
  return (
    <select ref={lista} className="agora-lista" aria-label={`Responsável de ${etapa.nome}`} value={etapa.responsavelId ?? ''}
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
