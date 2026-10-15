import { alternarMarcado } from '../../reunioes/marcados'

export type OpcaoParaMarcar = { id: string; rotulo: string }

type CaixasDeMarcarProps = {
  legenda: string
  opcoes: OpcaoParaMarcar[]
  marcados: string[]
  aoMudar: (marcados: string[]) => void
}

/** Um grupo de caixas de marcar, uma por linha: os processos, os usuários e os responsáveis do formulário da reunião. */
export function CaixasDeMarcar({ legenda, opcoes, marcados, aoMudar }: CaixasDeMarcarProps) {
  return (
    <fieldset className="reuniao-escolha">
      <legend>{legenda}</legend>
      {opcoes.map((opcao) => (
        <label key={opcao.id} className="reuniao-tipo-opcao">
          <input type="checkbox" checked={marcados.includes(opcao.id)}
            onChange={() => aoMudar(alternarMarcado(marcados, opcao.id))} />
          {opcao.rotulo}
        </label>
      ))}
    </fieldset>
  )
}
