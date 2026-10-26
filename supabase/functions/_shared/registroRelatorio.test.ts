import { describe, expect, it } from 'vitest'
import { conferirArquivosNoDrive, validarRegistrar, type ArquivoNoDrive, type ArquivoPedido } from './registro.ts'

// O relatório com numeração própria no registro (ADR 0026): o número vem no pedido, o nome do Drive o traz e só vale .docx.
const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'
const PASTA = 'pasta-do-processo'
const MD5 = '0123456789abcdef0123456789abcdef'

function entrada(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    processo_id: PROCESSO,
    numero: 3,
    arquivos: [{ papel: 'bpmn', drive_id: 'id-bpmn' }, { papel: 'png', drive_id: 'id-png' }],
    ...mudancas,
  }
}

function codigoDe(corpo: unknown): string | null {
  const resultado = validarRegistrar(corpo)
  return resultado.ok ? null : resultado.recusa.codigo
}

function lido(id: string, nome: string, mudancas: Partial<ArquivoNoDrive> = {}): ArquivoNoDrive {
  return { id, name: nome, size: '1024', md5Checksum: MD5, parents: [PASTA], ...mudancas }
}

describe('relatório numerado (numero_do_relatorio)', () => {
  const relatorio = { papel: 'relatorio', drive_id: 'id-relatorio' }
  const bpm = { papel: 'bpm', drive_id: 'id-bpm' }

  it('o relatório sozinho exige o número do relatório e é lido como veio', () => {
    const resultado = validarRegistrar(entrada({ arquivos: [relatorio], numero: 8, numero_do_relatorio: 3 }))
    expect(resultado.ok && resultado.valor.numeroDoRelatorio).toBe(3)
    expect(resultado.ok && resultado.valor.arquivos).toEqual([{ papel: 'relatorio', driveId: 'id-relatorio' }])
  })

  it('o relatório junto com a versão em sequência ou piloto também leva o número', () => {
    expect(codigoDe(entrada({ arquivos: [bpm, relatorio], numero_do_relatorio: 3 }))).toBeNull()
    expect(codigoDe(entrada({ arquivos: [bpm, relatorio], numero_do_relatorio: 3, piloto: true }))).toBeNull()
  })

  it.each([
    ['relatório sem o número', { arquivos: [relatorio] }],
    ['número zero', { arquivos: [relatorio], numero_do_relatorio: 0 }],
    ['número de tipo errado', { arquivos: [relatorio], numero_do_relatorio: '3' }],
    ['número sem relatório', { arquivos: [bpm], numero_do_relatorio: 3 }],
    ['número no relatório da histórica', { arquivos: [bpm, relatorio], historica: true, numero_do_relatorio: 3 }],
  ])('recusa %s', (_nome, mudancas) => {
    expect(codigoDe(entrada(mudancas))).toBe('entrada_invalida')
  })

  it('o relatório da histórica não tem número', () => {
    expect(codigoDe(entrada({ arquivos: [bpm, relatorio], historica: true }))).toBeNull()
  })

  it('a troca do relatório não leva número', () => {
    const ARQUIVO = '8f000000-0000-0000-0000-0000000000d1'
    expect(codigoDe(entrada({ arquivos: [relatorio], arquivo_id: ARQUIVO }))).toBeNull()
  })
})

describe('conferirArquivosNoDrive: relatório numerado', () => {
  const pedidos: ArquivoPedido[] = [{ papel: 'relatorio', driveId: 'id-rel' }]
  const conferir = (nome: string, numero: number | null) => {
    const resultado = conferirArquivosNoDrive(pedidos, [lido('id-rel', nome)], PASTA, 'V8', numero)
    return resultado.ok ? null : resultado.recusa
  }

  it('aceita o .docx cujo nome traz o número do relatório do pedido', () => {
    expect(conferir('TSA_V8_Emitir Ofício_Relatório V3.docx', 3)).toBeNull()
  })

  it('recusa o .pdf, citando o recebido e o esperado', () => {
    const recusa = conferir('TSA_V8_Emitir Ofício_Relatório V3.pdf', 3)
    expect(recusa?.codigo).toBe('extensao_nao_aceita')
    expect(recusa?.mensagem).toContain('recebido .pdf')
  })

  it('recusa o nome com outro número de relatório', () => {
    const recusa = conferir('TSA_V8_Emitir Ofício_Relatório V2.docx', 3)
    expect(recusa?.codigo).toBe('arquivo_nao_chegou')
    expect(recusa?.mensagem).toContain('esperado o relatório V3')
  })
})
