import { fireEvent, screen, within } from '@testing-library/react'

/** O verso aberto: o diálogo "Processo {nome}", ou "Processo" enquanto carrega. */
export const versoAberto = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))

/** A janela aberta por cima do verso (motivo, confirmação, avanço): a última janela aberta. */
export const janelaPorCima = (): HTMLElement => screen.getAllByRole('dialog').at(-1) as HTMLElement

/** Abre o "⋯" do processo e escolhe a ação (Histórico, Editar, Reclassificar, Suspender, Retomar, Cancelar, Excluir). */
export async function escolherNoMenuDoProcesso(acao: string): Promise<void> {
  const verso = await versoAberto()
  fireEvent.click(await verso.findByRole('button', { name: 'Ações do processo' }))
  fireEvent.click(verso.getByRole('menuitem', { name: acao }))
}

/** As janelas abertas por cima do verso; vazia quando só o verso está aberto. */
export const janelasPorCima = (): HTMLElement[] => screen.queryAllByRole('dialog').filter((janela) => !janela.classList.contains('verso'))
