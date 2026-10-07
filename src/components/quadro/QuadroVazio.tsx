import { Icone } from '../Icone'
import './QuadroVazio.css'

// O botão ainda não abre nada: o cadastro chega com a funcionalidade "Processos e etapas".
export function QuadroVazio() {
  return (
    <section className="quadro-vazio" aria-labelledby="quadro-vazio-titulo">
      <h2 id="quadro-vazio-titulo" className="quadro-vazio-titulo">
        Nenhum processo cadastrado ainda.
      </h2>
      <p className="quadro-vazio-texto">Cadastre o primeiro ou importe a planilha atual.</p>
      <button type="button" className="botao botao-principal">
        <Icone nome="mais" tamanho={16} />
        Cadastrar processo
      </button>
    </section>
  )
}
