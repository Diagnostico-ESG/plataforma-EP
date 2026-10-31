import { expect } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

/** A faixa de controles da área de processos. */
export async function faixaDeControles(): Promise<HTMLElement> {
  return screen.findByRole('group', { name: 'Controles dos processos' })
}

/** O botão "Quadro ▾", que leva o nome da forma de ver escolhida, tal como está (habilitado ou não). */
export async function botaoDaFormaDeVerAgora(): Promise<HTMLElement> {
  const botoes = within(await faixaDeControles()).getAllByRole('button')
  const botao = botoes.find((candidato) => candidato.getAttribute('aria-haspopup') === 'menu')
  if (!botao) throw new Error('A faixa não tem o botão da forma de ver (aria-haspopup="menu").')
  return botao
}

/** O botão "Quadro ▾" depois que os processos carregaram (a faixa o desabilita enquanto carregam). */
export async function botaoDaFormaDeVer(): Promise<HTMLElement> {
  const botao = await botaoDaFormaDeVerAgora()
  await waitFor(() => expect(botao.matches(':disabled')).toBe(false))
  return botao
}

/** Abre "Quadro ▾" e escolhe a forma de ver pelo nome do item. */
export async function escolherFormaDeVer(nome: string): Promise<void> {
  fireEvent.click(await botaoDaFormaDeVer())
  fireEvent.click(within(screen.getByRole('menu', { name: 'Forma de ver' })).getByRole('menuitemradio', { name: nome }))
}
