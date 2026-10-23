import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

type ConfirmarSaidaSemSalvarProps = { aberta: boolean; aoSair: () => void; aoContinuar: () => void }

/** A confirmação simples (ADR 0003) de quem sai do verso com anotações que não foram gravadas. O foco abre em [Continuar escrevendo]. */
export function ConfirmarSaidaSemSalvar({ aberta, aoSair, aoContinuar }: ConfirmarSaidaSemSalvarProps) {
  return (
    <JanelaDeConfirmacao aberta={aberta} titulo="As anotações não foram salvas. Sair mesmo assim?" rotuloDaAcao="Sair sem salvar"
      rotuloDoCancelar="Continuar escrevendo" aoConfirmar={aoSair} aoFechar={aoContinuar} />
  )
}
