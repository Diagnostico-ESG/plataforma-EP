import { describe, expect, test } from 'vitest'
import { type ArquivoDaPasta, lerNomeDoArquivo, lerPasta } from './lerPasta'

// A pasta DOCUMENTOS MAPEAMENTO (amostra/pasta.md): SIGLA_V<n><F|P|>_<Nome>[_Relatório].<ext>, uma pasta por setor. Nomes inventados.
function daPasta(...caminhos: string[]): ArquivoDaPasta[] {
  return caminhos.map((caminho) => ({ caminho, arquivo: new File(['x'], caminho.split('/').at(-1) ?? caminho) }))
}

describe('o nome do arquivo', () => {
  test('lê sigla, número, letra, nome do processo e o papel', () => {
    expect(lerNomeDoArquivo('ABC_V2F_Exemplo Alfa_Relatório.docx')).toEqual({
      sigla: 'ABC', numero: 2, letra: 'F', nomeDoProcesso: 'Exemplo Alfa', papel: 'relatorio',
    })
    expect(lerNomeDoArquivo('ABC-DEF_V10_Processo - Parte A, Análise e Envio.bpm')).toMatchObject({
      sigla: 'ABC-DEF', numero: 10, letra: '', nomeDoProcesso: 'Processo - Parte A, Análise e Envio', papel: 'bpm',
    })
    expect(lerNomeDoArquivo('ABC_V1P_Exemplo Alfa.PNG')).toMatchObject({ letra: 'P', papel: 'png' })
    expect(lerNomeDoArquivo('ABC_V1_Exemplo Alfa_Relatório.pdf')).toMatchObject({ papel: 'pdf' })
  })

  test.each(['log_renomeacao.csv', 'Renomear-Padrao.ps1', 'ABC_Exemplo Alfa.bpm', 'ABC_V1_Exemplo Alfa.docx', 'ABC_V1_Exemplo Alfa_Relatório.bpm'])(
    '"%s" está fora do padrão', (nome) => {
      expect(lerNomeDoArquivo(nome)).toBeNull()
    })
})

describe('as versões da pasta', () => {
  test('a letra diz o tipo, e um processo pode ter várias históricas', () => {
    const lida = lerPasta(daPasta(
      'Documentos Mapeamento/ABC/ABC_V1F_Exemplo Alfa.bpm', 'Documentos Mapeamento/ABC/ABC_V2F_Exemplo Alfa.bpm',
      'Documentos Mapeamento/ABC/ABC_V3P_Exemplo Alfa.bpm', 'Documentos Mapeamento/ABC/ABC_V4_Exemplo Alfa.bpm',
    ))
    expect(lida.versoes.map((v) => [v.rotulo, v.tipo])).toEqual([
      ['V1F', 'historica'], ['V2F', 'historica'], ['V3P', 'piloto'], ['V4', 'sequencia'],
    ])
  })

  test('o .png, o relatório e o .pdf entram na versão do .bpm', () => {
    const [versao] = lerPasta(daPasta(
      'D/ABC/ABC_V2_Exemplo Alfa.bpm', 'D/ABC/ABC_V2_Exemplo Alfa.png',
      'D/ABC/ABC_V2_Exemplo Alfa_Relatório.docx', 'D/ABC/ABC_V2_Exemplo Alfa_Relatório.pdf',
    )).versoes
    expect([versao.bpm.name, versao.png?.name, versao.relatorio?.name, versao.pdfDoRelatorio?.name]).toEqual([
      'ABC_V2_Exemplo Alfa.bpm', 'ABC_V2_Exemplo Alfa.png', 'ABC_V2_Exemplo Alfa_Relatório.docx', 'ABC_V2_Exemplo Alfa_Relatório.pdf',
    ])
    expect(versao.letraCorrigida).toBe(false)
  })

  test('o arquivo com letra diferente da do .bpm entra na versão do .bpm, com a letra dele', () => {
    const lida = lerPasta(daPasta('D/ABC/ABC_V1F_Exemplo Alfa.bpm', 'D/ABC/ABC_V1_Exemplo Alfa_Relatório.docx'))
    expect(lida.versoes).toHaveLength(1)
    expect(lida.versoes[0]).toMatchObject({ rotulo: 'V1F', tipo: 'historica', letraCorrigida: true })
    expect(lida.versoes[0].relatorio?.name).toBe('ABC_V1_Exemplo Alfa_Relatório.docx')
  })

  test('a versão sem .bpm fica de fora e listada; as outras do processo entram', () => {
    const lida = lerPasta(daPasta('D/ABC/ABC_V1_Exemplo Alfa_Relatório.docx', 'D/ABC/ABC_V2_Exemplo Alfa.bpm'))
    expect(lida.versoes.map((v) => v.rotulo)).toEqual(['V2'])
    expect(lida.semBpm).toEqual([{ chave: 'ABC|exemplo alfa', nomeDoProcesso: 'Exemplo Alfa', rotulo: 'V1' }])
  })

  test('sem .png nem relatório, a versão entra sem aviso', () => {
    const lida = lerPasta(daPasta('D/ABC/ABC_V1_Exemplo Alfa.bpm'))
    expect(lida.versoes[0]).toMatchObject({ png: null, relatorio: null, pdfDoRelatorio: null, letraCorrigida: false })
    expect([lida.semBpm, lida.duplicados, lida.foraDoPadrao]).toEqual([[], [], []])
  })

  test('dois .docx de relatório na mesma versão: a versão entra sem relatório, e os dois ficam listados', () => {
    const lida = lerPasta(daPasta(
      'D/ABC/ABC_V1F_Exemplo Alfa.bpm', 'D/ABC/ABC_V1F_Exemplo Alfa_Relatório.docx', 'D/ABC/ABC_V1_Exemplo Alfa_Relatório.docx',
    ))
    expect(lida.versoes[0].relatorio).toBeNull()
    expect(lida.duplicados).toEqual([{ chave: 'ABC|exemplo alfa', nomeDoProcesso: 'Exemplo Alfa', rotulo: 'V1F', papel: 'relatorio' }])
  })

  test('dois .bpm na mesma versão: a versão fica de fora, listada', () => {
    const lida = lerPasta(daPasta('D/ABC/ABC_V1F_Exemplo Alfa.bpm', 'D/ABC/ABC_V1_Exemplo Alfa.bpm'))
    expect(lida.versoes).toEqual([])
    expect(lida.duplicados).toMatchObject([{ rotulo: 'V1F', papel: 'bpm' }])
  })

  test('os arquivos da raiz e os fora do padrão ficam listados pelo caminho', () => {
    const lida = lerPasta(daPasta('D/log_renomeacao.csv', 'D/ABC/ABC_V1_Exemplo Alfa.bpm', 'D/ABC/sem padrão.docx'))
    expect(lida.foraDoPadrao).toEqual(['D/log_renomeacao.csv', 'D/ABC/sem padrão.docx'])
  })

  test('a subpasta dentro do setor é lida, e o processo fica marcado com o nome dela uma vez', () => {
    const lida = lerPasta(daPasta('D/XYZ/Grupo de Processos/XYZ_V1_Exemplo Beta.bpm', 'D/XYZ/Grupo de Processos/XYZ_V2_Exemplo Beta.bpm'))
    expect(lida.versoes.map((v) => v.chave)).toEqual(['XYZ|exemplo beta', 'XYZ|exemplo beta'])
    expect(lida.subpastas).toEqual([{ chave: 'XYZ|exemplo beta', subpasta: 'Grupo de Processos' }])
  })
})
