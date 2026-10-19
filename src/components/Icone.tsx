import type { ReactNode } from 'react'

// Ícones desenhados no projeto (traço 1,75 numa grade de 24), sem pacote externo:
// a identidade pede poucos ícones e um pacote seria dependência nova com ADR.
const DESENHOS = {
  quadro: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="10" y="4" width="5" height="11" rx="1.5" />
      <rect x="17" y="4" width="4" height="7" rx="1.5" />
    </>
  ),
  lista: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  setores: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7.5h1M14 7.5h1M9 11.5h1M14 11.5h1M10 21v-4h4v4" />
    </>
  ),
  painel: <path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />,
  administracao: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  conta: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  lupa: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  mais: <path d="M12 5v14M5 12h14" />,
  fechar: <path d="M6 6l12 12M18 6L6 18" />,
  relogio: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  documento: <path d="M6 3h8l5 5v13H6zM14 3v5h5" />,
  rodadas: <path d="M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M20 12a8 8 0 0 1-14 5.3M6 21v-4h4" />,
  // O "⋯" dos menus de ações: três pontos cheios, mais legíveis que o traço fino.
  reticencias: (
    <g fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </g>
  ),
} satisfies Record<string, ReactNode>

export type NomeIcone = keyof typeof DESENHOS

type IconeProps = {
  nome: NomeIcone
  tamanho?: number
}

/** Ícone decorativo: quem o usa dá o rótulo acessível ao botão ou ao texto ao lado. */
export function Icone({ nome, tamanho = 20 }: IconeProps) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DESENHOS[nome]}
    </svg>
  )
}
