import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { CadastrosFalso } from '../../cadastros/CadastrosFalso'
import type { SetorDaLista } from '../../cadastros/tipos'
import { ProcessosFalso } from '../../processos/ProcessosFalso'
import { processoLido } from '../../testes/processoNoVerso'
import { FormularioDoProcesso } from './FormularioDoProcesso'

afterEach(cleanup)

// Os setores nunca chegam: o formulário fica no estado de carregando.
class CadastrosQueNaoChegam extends CadastrosFalso {
  async listarSetores(): Promise<SetorDaLista[]> {
    return new Promise<SetorDaLista[]>(() => {})
  }
}

function abrirCarregando(inicial?: Parameters<typeof FormularioDoProcesso>[0]['inicial']) {
  render(
    <FormularioDoProcesso cadastros={new CadastrosQueNaoChegam()} processos={new ProcessosFalso()} titulo="Cadastrar processo"
      inicial={inicial} aoSalvar={vi.fn()} aoCancelar={vi.fn()} />,
  )
}

test('carregando: o texto para o leitor de tela e blocos cinza no lugar dos campos, sem formulário ainda', () => {
  abrirCarregando()
  expect(screen.getByRole('status').textContent).toBe('Carregando setores e macroprocessos…')
  expect(screen.queryByRole('form')).toBeNull()
  const blocos = document.querySelectorAll('[aria-hidden="true"] .verso-fantasma')
  expect(blocos.length).toBeGreaterThan(0)
})

test('carregando: o cadastro reserva o lugar do Tipo e das Anotações, a edição não', () => {
  abrirCarregando()
  const noCadastro = document.querySelectorAll('.formulario-fantasma-campo').length
  cleanup()
  abrirCarregando(processoLido({}, 'modelagem'))
  const naEdicao = document.querySelectorAll('.formulario-fantasma-campo').length
  expect(noCadastro).toBe(naEdicao + 2)
})
