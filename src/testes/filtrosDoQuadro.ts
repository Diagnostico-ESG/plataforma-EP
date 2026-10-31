import { fireEvent, screen, within } from '@testing-library/react'

/** O botão [Filtros] da faixa (o nome muda com o contador: "Filtros" ou "Filtros, n ligados"). */
export async function botaoDosFiltros(): Promise<HTMLElement> {
  return screen.findByRole('button', { name: /^Filtros/ })
}

/** Abre o painel dos Filtros, se ainda não está aberto, e o devolve. */
export async function abrirFiltros(): Promise<HTMLElement> {
  const aberto = screen.queryByRole('dialog', { name: 'Filtros' })
  if (aberto) return aberto
  fireEvent.click(await botaoDosFiltros())
  return screen.getByRole('dialog', { name: 'Filtros' })
}

/** Escolhe uma opção num dos cinco filtros do Quadro, pelo painel. */
export async function escolherNoQuadro(rotulo: string, opcao: string): Promise<void> {
  const seletor = within(await abrirFiltros()).getByLabelText(rotulo)
  const valor = within(seletor).getByRole('option', { name: opcao }).getAttribute('value')
  fireEvent.change(seletor, { target: { value: valor } })
}
