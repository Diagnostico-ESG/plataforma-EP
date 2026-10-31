type TelaEmBreveProps = { titulo: string; texto: string }

/** Tela estática das áreas que ainda não existem (Painel, Ajuda), para o botão da faixa nunca parecer quebrado. */
export function TelaEmBreve({ titulo, texto }: TelaEmBreveProps) {
  return (
    <section className="tela-em-breve" aria-label={titulo}>
      <h2 className="tela-em-breve-titulo">Em breve</h2>
      <p className="tela-em-breve-texto">{texto}</p>
    </section>
  )
}
