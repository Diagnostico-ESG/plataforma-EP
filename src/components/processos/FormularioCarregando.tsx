type FormularioCarregandoProps = {
  /** O cadastro tem o campo Tipo a mais; a edição não. */
  comTipo: boolean
}

// Nome, Setor e Macroprocesso (e o Tipo, no cadastro); as Anotações, só no cadastro, são uma caixa de texto.
const CAMPOS_SIMPLES = 3

/**
 * O formulário do processo enquanto setores e macroprocessos carregam: blocos cinza do tamanho dos campos e do
 * rodapé, para a janela estreita não mudar de altura quando os dados chegam. O leitor de tela ouve o texto de sempre.
 */
export function FormularioCarregando({ comTipo }: FormularioCarregandoProps) {
  const simples = CAMPOS_SIMPLES + (comTipo ? 1 : 0)
  return (
    <>
      <p className="visualmente-oculto" role="status">Carregando setores e macroprocessos…</p>
      <div className="formulario-do-processo" aria-hidden="true">
        {Array.from({ length: simples }, (_, i) => <CampoFantasma key={`s${i}`} />)}
        {Array.from({ length: comTipo ? 1 : 0 }, (_, i) => <CampoFantasma key={`t${i}`} longo />)}
        <div className="formulario-do-processo-rodape">
          <span className="verso-fantasma formulario-fantasma-botao" />
          <span className="verso-fantasma formulario-fantasma-botao" />
        </div>
      </div>
    </>
  )
}

function CampoFantasma({ longo = false }: { longo?: boolean }) {
  return (
    <div className="formulario-fantasma-campo">
      <span className="verso-fantasma formulario-fantasma-rotulo" />
      <span className={`verso-fantasma ${longo ? 'formulario-fantasma-texto' : 'formulario-fantasma-controle'}`} />
    </div>
  )
}
