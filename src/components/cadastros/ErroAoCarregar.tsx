type ErroAoCarregarProps = { alvo: string; aoTentarDeNovo: () => void }

export function ErroAoCarregar({ alvo, aoTentarDeNovo }: ErroAoCarregarProps) {
  return (
    <div className="cadastros-erro" role="alert">
      <p>Não foi possível carregar {alvo}. Verifique a conexão e tente de novo.</p>
      <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
    </div>
  )
}
