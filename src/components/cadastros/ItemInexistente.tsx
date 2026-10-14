import { TEXTO_DE_CADASTRO_INEXISTENTE } from '../../cadastros/cadastroInexistente'

type ItemInexistenteProps = { aoVoltar: () => void; texto?: string; rotuloDoBotao?: string }

/** O item aberto foi excluído por outra pessoa: o aviso e o caminho de volta (por padrão, o dos cadastros). */
export function ItemInexistente({
  aoVoltar, texto = TEXTO_DE_CADASTRO_INEXISTENTE, rotuloDoBotao = 'Voltar à lista',
}: ItemInexistenteProps) {
  return (
    <div className="cadastros-erro" role="alert">
      <p>{texto}</p>
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>{rotuloDoBotao}</button>
    </div>
  )
}
