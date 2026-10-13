import { TEXTO_DE_CADASTRO_INEXISTENTE } from '../../cadastros/cadastroInexistente'

export function ItemInexistente({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <div className="cadastros-erro" role="alert">
      <p>{TEXTO_DE_CADASTRO_INEXISTENTE}</p>
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>Voltar à lista</button>
    </div>
  )
}
