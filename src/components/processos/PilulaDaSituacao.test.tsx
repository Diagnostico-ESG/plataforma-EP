import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { SituacaoDoProcesso } from '../../processos/tipos'
import { PilulaDaSituacao } from './PilulaDaSituacao'

afterEach(cleanup)

test.each<[SituacaoDoProcesso, string, string]>([
  ['em_andamento', 'Em andamento', 'pilula-informativa'],
  ['suspenso', 'Suspenso', 'pilula-vencendo'],
  ['cancelado', 'Cancelado', 'pilula-atraso'],
  ['concluido', 'Concluído', 'pilula-aprovado'],
])('a situação %s aparece em pílula colorida com o texto "%s" (a cor nunca diz o valor sozinha)', (situacao, texto, classe) => {
  render(<PilulaDaSituacao situacao={situacao} />)
  expect(screen.getByText(texto).classList.contains(classe)).toBe(true)
})
