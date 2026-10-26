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

  it('põe o P na versão piloto, com os três arquivos', () => {
    expect(nomePadrao({ ...base, piloto: true, papel: 'bpm', extensao: 'bpm' })).toBe('CEE_V6P_Nome do processo.bpm')
    expect(nomePadrao({ ...base, piloto: true, papel: 'png', extensao: 'png' })).toBe('CEE_V6P_Nome do processo.png')
    expect(nomePadrao({ ...base, piloto: true })).toBe('CEE_V6P_Nome do processo.bpmn')
  })

  it('acrescenta _Relatório no relatório', () => {
    expect(nomePadrao({ ...base, papel: 'relatorio', extensao: 'pdf' })).toBe(
      'CEE_V6_Nome do processo_Relatório.pdf',
    )
  })

  it('numera o relatório com o número do relatório, depois da versão que ele acompanha', () => {
    const relatorio = { ...base, numero: 8, papel: 'relatorio' as const, extensao: 'docx' }
    expect(nomePadrao({ ...relatorio, numeroDoRelatorio: 3 })).toBe('CEE_V8_Nome do processo_Relatório V3.docx')
    expect(nomePadrao({ ...relatorio, numero: 6, piloto: true, numeroDoRelatorio: 1 })).toBe(
      'CEE_V6P_Nome do processo_Relatório V1.docx',
    )
  })

  it('o relatório da histórica não tem número', () => {
    expect(nomePadrao({ ...base, numero: 5, historica: true, papel: 'relatorio', extensao: 'docx' })).toBe(
      'CEE_V5F_Nome do processo_Relatório.docx',
    )
  })

  it.each([0, -1, 1.5])('recusa o número de relatório %s com o valor recebido e o formato esperado', (numeroDoRelatorio) => {
    expect(() => nomePadrao({ ...base, papel: 'relatorio', extensao: 'docx', numeroDoRelatorio })).toThrow(
      `número do relatório inválido (recebido: ${numeroDoRelatorio}); esperado: número inteiro maior que zero`,
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

describe('nomePadrao do .pdf da aprovação', () => {
  it('leva a versão aprovada e o sufixo _Aprovação', () => {
    expect(nomePadrao({ ...base, numero: 8, papel: 'pdf_da_aprovacao', extensao: 'pdf' })).toBe(
      'CEE_V8_Nome do processo_Aprovação.pdf',
    )
  })

  it('limpa os caracteres que o Drive não aceita no nome do processo', () => {
    expect(nomePadrao({ ...base, numero: 2, nomeDoProcesso: 'Emitir: ofício/guia', papel: 'pdf_da_aprovacao', extensao: 'PDF' })).toBe(
      'CEE_V2_Emitir- ofício-guia_Aprovação.pdf',
    )
  })
})
