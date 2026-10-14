import { Icone } from '../Icone'
import './QuadroVazio.css'

type QuadroVazioProps = { podeCadastrar: boolean; aoCadastrar: () => void }

export function QuadroVazio({ podeCadastrar, aoCadastrar }: QuadroVazioProps) {
  return (
    <section className="quadro-vazio" aria-labelledby="quadro-vazio-titulo">
      <h2 id="quadro-vazio-titulo" className="quadro-vazio-titulo">
        Nenhum processo cadastrado ainda.
      </h2>
      <p className="quadro-vazio-texto">Cadastre o primeiro ou importe a planilha atual.</p>
      {podeCadastrar && (
        <button type="button" className="botao botao-principal" onClick={aoCadastrar}>
          <Icone nome="mais" tamanho={16} />
          Cadastrar processo
        </button>
      )}
    </section>
  )
}
