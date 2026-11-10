import { expect, test } from 'vitest'
import { iconeDaEtapa } from './iconeDaEtapa'

test('cada etapa fixa ou com campos próprios tem o seu ícone, e uma etapa nova recebe o genérico', () => {
  const codigos = ['nao_iniciados', 'modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_relatorio', 'revisao_setor', 'aprovacao_setor', 'publicacao', 'concluidos']
  const icones = codigos.map(iconeDaEtapa)
  expect(new Set(icones).size).toBe(9)
  expect(icones).not.toContain('etapaGenerica')
  expect(iconeDaEtapa('analise_juridica')).toBe('etapaGenerica')
})
