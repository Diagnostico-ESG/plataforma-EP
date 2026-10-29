import { useEffect, useRef, useState } from 'react'
import type { OpcaoDeResponsavel } from '../../processos/agoraDoProcesso'
import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'

type TrocaDoResponsavelProps = {
  /** O responsável de agora (null: ninguém); a lista mostra sempre o valor vindo daqui. */
  responsavelId: string | null
  /** O nome que o botão mostra, já com "(Inativo)" quando é o caso; null: ninguém. */
  nome: string | null
  opcoes: OpcaoDeResponsavel[]
  desabilitada: boolean
  /** Grava ao escolher, sem confirmação; null é "Ninguém por enquanto". */
  aoEscolher: (usuarioId: string | null) => void
}

/**
 * O nome do responsável (ou "Escolher responsável", sem ninguém) é o botão que abre a lista suspensa. Escolher grava e
 * fecha; Esc fecha só a lista. O valor mostrado vem sempre do processo, então uma gravação que falha deixa o responsável como estava.
 */
export function TrocaDoResponsavel({ responsavelId, nome, opcoes, desabilitada, aoEscolher }: TrocaDoResponsavelProps) {
  const [trocando, setTrocando] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLSelectElement>(null)
  const jaAbriu = useRef(false)

  // O foco acompanha a troca: vai à lista ao abrir e volta ao nome ao fechar, para o teclado não se perder.
  useEffect(() => {
    if (trocando) {
      jaAbriu.current = true
      lista.current?.focus()
    } else if (jaAbriu.current) botao.current?.focus()
  }, [trocando])

  if (!trocando) {
    // Sem ninguém, o texto "Escolher responsável" já é o nome acessível; com alguém, o nome diz a ação junto.
    return (
      <button ref={botao} type="button" className={nome ? 'agora-responsavel-nome' : 'agora-escolher'}
        aria-label={nome ? `Trocar o responsável: ${nome}` : undefined} disabled={desabilitada} onClick={() => setTrocando(true)}>
        {nome ?? 'Escolher responsável'}
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
      <BotaoDaCaixa />
      {opcoes.map((opcao) => <OpcaoDaCaixa key={opcao.valor} {...opcao} />)}
    </select>
  )
}
