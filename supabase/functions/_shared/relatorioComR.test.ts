import { describe, expect, it } from 'vitest'
import { situacaoDoNomeDoRelatorio, validarRenomearRelatorio } from './relatorioComR.ts'

const ID = '0f000000-0000-4000-8000-000000000001'

describe('situacaoDoNomeDoRelatorio', () => {
  it('o nome com V e o número guardado se renomeia, trocando só a letra do fim', () => {
    expect(situacaoDoNomeDoRelatorio('CEE_V7_Compras_Relatório V2.docx', 2))
      .toEqual({ tipo: 'a_renomear', nomeNovo: 'CEE_V7_Compras_Relatório R2.docx' })
  })

  it('vale também para o .pdf numerado', () => {
    expect(situacaoDoNomeDoRelatorio('CEE_V7_Compras_Relatório V12.pdf', 12))
      .toEqual({ tipo: 'a_renomear', nomeNovo: 'CEE_V7_Compras_Relatório R12.pdf' })
  })

  it('o nome que já tem R fica como está', () => {
    expect(situacaoDoNomeDoRelatorio('CEE_V7_Compras_Relatório R2.docx', 2)).toEqual({ tipo: 'com_r' })
  })

  it('número do nome diferente do guardado fica fora do padrão', () => {
    expect(situacaoDoNomeDoRelatorio('CEE_V7_Compras_Relatório V3.docx', 2)).toEqual({ tipo: 'fora_do_padrao' })
  })

  it('V12 não se confunde com V1', () => {
    expect(situacaoDoNomeDoRelatorio('CEE_V7_Compras_Relatório V12.docx', 1)).toEqual({ tipo: 'fora_do_padrao' })
  })

  it('"Relatório V2" no meio do nome, e não no fim, fica fora do padrão', () => {
    expect(situacaoDoNomeDoRelatorio('Relatório V2 do setor.docx', 2)).toEqual({ tipo: 'fora_do_padrao' })
  })

  it('relatório sem número fica fora do padrão', () => {
    expect(situacaoDoNomeDoRelatorio('CEE_V5F_Compras_Relatório.pdf', null)).toEqual({ tipo: 'fora_do_padrao' })
  })
})

describe('validarRenomearRelatorio', () => {
  it('lê o id do arquivo', () => {
    expect(validarRenomearRelatorio({ acao: 'renomear_relatorio', arquivo_id: ID })).toEqual({ ok: true, valor: { arquivoId: ID } })
  })

  it.each([null, 'texto', [ID]])('recusa o corpo %j, que não é objeto', (corpo) => {
    const resultado = validarRenomearRelatorio(corpo)
    expect(resultado.ok ? null : resultado.recusa.codigo).toBe('entrada_invalida')
  })

  it.each([undefined, 3, 'nao-e-uuid'])('recusa o arquivo_id %j, citando o esperado', (arquivoId) => {
    const resultado = validarRenomearRelatorio({ arquivo_id: arquivoId })
    expect(resultado.ok ? null : resultado.recusa.mensagem).toContain('campo arquivo_id: esperado uuid')
  })
})
