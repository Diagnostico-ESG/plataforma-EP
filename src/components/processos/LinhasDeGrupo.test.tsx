import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import type { MacroDaArvore, SetorDaArvore } from '../../processos/arvoreDaLista'
import { LinhaDoMacro, LinhaDoSetor } from './LinhasDeGrupo'

afterEach(cleanup)

const MACRO: MacroDaArvore = { id: 'm1', nome: 'Macro Um', total: 2, setores: [] }
const SETOR: SetorDaArvore = { id: 's1', sigla: 'TSA', nome: 'Setor A', cor: 3, itens: [] }

const dentroDaTabela = (linha: React.ReactNode) => render(<table><tbody>{linha}</tbody></table>)

test('o macroprocesso tem nome acessível com a contagem e anuncia se está aberto', () => {
  const aoAlternar = vi.fn()
  dentroDaTabela(<LinhaDoMacro macro={MACRO} aberto aoAlternar={aoAlternar} />)
  const botao = screen.getByRole('button', { name: 'Macro Um, 2 processos' })
  expect(botao.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(botao)
  expect(aoAlternar).toHaveBeenCalledOnce()
})

test('a contagem de um só processo fica no singular', () => {
  dentroDaTabela(<LinhaDoMacro macro={{ ...MACRO, total: 1 }} aberto={false} aoAlternar={() => {}} />)
  expect(screen.getByRole('button', { name: 'Macro Um, 1 processo' }).getAttribute('aria-expanded')).toBe('false')
})

test('o setor mostra o selo da sigla, o nome e a contagem', () => {
  const itens = [1, 2, 3].map((n) => ({ linha: { id: `p${n}` } as never, nivel: 0, subprocessoDe: null }))
  dentroDaTabela(<LinhaDoSetor setor={{ ...SETOR, itens }} aberto aoAlternar={() => {}} />)
  expect(screen.getByRole('button', { name: 'TSA Setor A, 3 processos' })).toBeTruthy()
  expect(document.querySelector('.selo-do-setor')?.textContent).toBe('TSA')
})
