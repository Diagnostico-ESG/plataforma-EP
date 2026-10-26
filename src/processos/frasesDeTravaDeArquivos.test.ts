import { expect, test } from 'vitest'
import { fraseDaTrava, fraseDaTravaDaTecnica } from './frasesDeTravaDeArquivos'

test('a trava da Modelagem piloto pede a versão piloto', () => {
  expect(fraseDaTrava({ codigo: 'modelagem', nome: 'Modelagem piloto', falta: ['versao_piloto'] }))
    .toBe('Para sair da Modelagem piloto, envie a versão piloto (.bpm).')
})

test('a trava da técnica diz só o que falta', () => {
  const trava = (falta: ('versao' | 'relatorio')[]) => fraseDaTrava({ codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', falta })
  expect(trava(['versao'])).toBe('Para sair da Relatório e modelagem técnica, envie a versão.')
  expect(trava(['relatorio'])).toBe('Para sair da Relatório e modelagem técnica, envie o relatório.')
  expect(trava(['versao', 'relatorio'])).toBe('Para sair da Relatório e modelagem técnica, envie a versão e o relatório.')
})

test('um valor que o banco não manda é erro, com o valor recebido e o formato esperado', () => {
  expect(() => fraseDaTravaDaTecnica('nada')).toThrow('Valor "nada" não é do banco; esperado versao, relatorio ou versao_e_relatorio.')
})
