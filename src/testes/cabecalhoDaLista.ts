import { fireEvent, screen, within } from '@testing-library/react'

/** O botão do cabeçalho de uma coluna da Lista; o nome começa pelo rótulo e segue com o estado ("filtrado: …", "ordem …"). */
export async function botaoDaColuna(coluna: string): Promise<HTMLElement> {
  await screen.findAllByRole('columnheader')
  const cabecalho = document.querySelector('.tabela-de-processos thead') as HTMLElement
  return within(cabecalho).getByRole('button', { name: new RegExp(`^${coluna}(,|$)`) })
}

/** Abre o menu da coluna e escolhe uma opção (ordenação ou valor do filtro). */
export async function escolherNaColuna(coluna: string, opcao: string) {
  fireEvent.click(await botaoDaColuna(coluna))
  fireEvent.click(screen.getByRole('menuitemradio', { name: opcao }))
}

/** As opções do menu aberto da coluna, na ordem. */
export async function opcoesDaColuna(coluna: string): Promise<string[]> {
  fireEvent.click(await botaoDaColuna(coluna))
  return screen.getAllByRole('menuitemradio').map((opcao) => opcao.textContent ?? '')
}

/** Os nomes nas linhas da Lista (o botão do nome), na ordem da tabela, sem os botões do cabeçalho. */
export async function nomesNasLinhas(): Promise<string[]> {
  await screen.findAllByRole('cell')
  return Array.from(document.querySelectorAll('.tabela-de-processos tbody .cadastros-abrir')).map((botao) => botao.textContent ?? '')
}
