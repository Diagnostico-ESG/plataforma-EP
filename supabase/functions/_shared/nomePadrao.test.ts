import { describe, expect, it } from 'vitest'
import { limparParaNomeDeArquivo, nomePadrao, type DadosDoNome } from './nomePadrao.ts'

const base: DadosDoNome = {
  sigla: 'CEE',
  numero: 6,
  historica: false,
  nomeDoProcesso: 'Nome do processo',
  papel: 'bpmn',
  extensao: 'bpmn',
}

describe('nomePadrao', () => {
  it('monta o nome do fluxograma da versão nova', () => {
    expect(nomePadrao(base)).toBe('CEE_V6_Nome do processo.bpmn')
  })

  it('põe o F na versão histórica', () => {
    expect(nomePadrao({ ...base, numero: 5, historica: true, papel: 'png', extensao: 'png' })).toBe(
      'CEE_V5F_Nome do processo.png',
    )
  })

  it('acrescenta _Relatório no relatório', () => {
    expect(nomePadrao({ ...base, papel: 'relatorio', extensao: 'pdf' })).toBe(
      'CEE_V6_Nome do processo_Relatório.pdf',
    )
  })

  it('mantém os acentos', () => {
    expect(nomePadrao({ ...base, nomeDoProcesso: 'Concessão de Licença' })).toBe(
      'CEE_V6_Concessão de Licença.bpmn',
    )
  })

  it('escreve a extensão em minúsculas', () => {
    expect(nomePadrao({ ...base, extensao: 'BPMN' })).toBe('CEE_V6_Nome do processo.bpmn')
  })

  it.each([0, -1, 1.5])('recusa o número %s com o valor recebido e o formato esperado', (numero) => {
    expect(() => nomePadrao({ ...base, numero })).toThrow(
      `número da versão inválido (recebido: ${numero}); esperado: número inteiro maior que zero`,
    )
  })
})

describe('limparParaNomeDeArquivo', () => {
  it('troca por hífen os caracteres que não valem em nome de arquivo', () => {
    expect(limparParaNomeDeArquivo('a\\b/c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j')
  })

  it('troca os caracteres de controle por hífen', () => {
    expect(limparParaNomeDeArquivo('a\u0007b')).toBe('a-b')
  })

  it('reduz espaços repetidos e apara as pontas', () => {
    expect(limparParaNomeDeArquivo('  Nome   do   processo  ')).toBe('Nome do processo')
  })
})
