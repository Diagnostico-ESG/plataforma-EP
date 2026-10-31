import './SeloDoTipoDeArquivo.css'

/**
 * O tipo do arquivo (BPMN, PNG, DOCX…) em mono, branco sobre a cor do tipo, sempre ao lado do nome. É enfeite: o nome do
 * arquivo já diz o tipo, então o selo fica escondido da leitura de tela.
 */
export function SeloDoTipoDeArquivo({ formato }: { formato: string }) {
  const tipo = formato.toLowerCase()
  return <span className="selo-do-tipo" data-formato={tipo} aria-hidden="true">{tipo.toUpperCase()}</span>
}
