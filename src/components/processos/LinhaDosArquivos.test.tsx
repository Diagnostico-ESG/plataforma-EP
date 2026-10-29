import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { VersoesFalso } from '../../versoes/VersoesFalso'
import type { Versao } from '../../versoes/tipos'
import { LinhaDosArquivos } from './LinhaDosArquivos'

afterEach(cleanup)

const VERSAO: Versao = {
  id: 'v7', numero: 7, historica: false, piloto: false, enviadaEm: '2026-10-02T12:00:00Z', autor: null, etapa: null, aprovada: true,
  arquivos: [
    { id: 'a1', papel: 'png', nome: 'fluxo.png', formato: 'png', tamanho: 1 },
    { id: 'a2', papel: 'bpm', nome: 'fluxo.bpm', formato: 'bpm', tamanho: 1 },
    { id: 'a3', papel: 'relatorio', nome: 'relatorio.docx', formato: 'docx', tamanho: 1, numeroDoRelatorio: 2 },
  ],
}

function montar(estado: Parameters<typeof LinhaDosArquivos>[0]['estado'], falso = new VersoesFalso(), tentar = () => {}) {
  render(<table><tbody><LinhaDosArquivos estado={estado} modulo={falso} aoTentarDeNovo={tentar} /></tbody></table>)
  return falso
}

test('carregando, erro com Tentar de novo e sem versão', () => {
  const tentar = vi.fn()
  montar({ tipo: 'carregando' })
  expect(screen.getByText('Carregando arquivos…')).toBeTruthy()
  cleanup()
  montar({ tipo: 'erro' }, new VersoesFalso(), tentar)
  expect(screen.getByText(/Não foi possível carregar os arquivos\./)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(tentar).toHaveBeenCalledOnce()
  cleanup()
  montar({ tipo: 'pronto', versoes: [] })
  expect(screen.getByText('Sem versão ainda.')).toBeTruthy()
})

test('mostra a versão, o selo Aprovada e um link por arquivo, e o link baixa pelo módulo', async () => {
  const falso = montar({ tipo: 'pronto', versoes: [VERSAO] })
  expect(screen.getByText('V7')).toBeTruthy()
  expect(screen.getByText('Aprovada')).toBeTruthy()
  expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Imagem .png', 'Fluxograma .bpm', 'Relatório V2'])
  fireEvent.click(screen.getByRole('link', { name: /Baixar Relatório V2/ }))
  await waitFor(() => expect(falso.baixados).toEqual(['a3']))
})
