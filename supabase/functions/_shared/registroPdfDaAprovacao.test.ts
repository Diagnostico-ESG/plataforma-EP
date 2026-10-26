import { describe, expect, it } from 'vitest'
import {
  conferirArquivosNoDrive,
  funcaoDoBancoPara,
  parametrosDoBanco,
  recusaDoBanco,
  statusDaRecusaDoBanco,
  validarRegistrar,
  type ArquivoNoDrive,
  type ArquivoPedido,
} from './registro.ts'

// O .pdf protocolado da aprovação no registro (revisoes-aprovacao, ticket 06): um arquivo só, sem versão, e gravado por
// funções próprias do banco; o nome do Drive traz a versão aprovada e só vale .pdf.
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

describe('o .pdf da aprovação (papel pdf_da_aprovacao)', () => {
  const ARQUIVO = '8f000000-0000-0000-0000-0000000000d1'
  const VERSAO = '8f000000-0000-0000-0000-0000000000c1'
  const pdf = [{ papel: 'pdf_da_aprovacao', drive_id: 'id-pdf' }]
  const gravar = [{
    papel: 'pdf_da_aprovacao' as const, nome: 'CEE_V8_Nome_Aprovação.pdf', formato: 'pdf', tamanho: 9, hash_md5: MD5, drive_id: 'id-pdf',
  }]
  const base = { processoId: PROCESSO, numero: 8, historica: false, piloto: false, versaoId: null, numeroDoRelatorio: null, arquivoId: null, arquivos: [] }

  it('lê o único arquivo, o .pdf da aprovação, com o número da versão aprovada', () => {
    const resultado = validarRegistrar(entrada({ numero: 8, arquivos: pdf }))
    expect(resultado.ok && resultado.valor.arquivos).toEqual([{ papel: 'pdf_da_aprovacao', driveId: 'id-pdf' }])
  })

  it.each([
    ['um arquivo a mais', { arquivos: [...pdf, { papel: 'png', drive_id: 'id-png' }] }],
    ['histórica', { arquivos: pdf, historica: true }],
    ['piloto', { arquivos: pdf, piloto: true }],
    ['versao_id', { arquivos: pdf, versao_id: VERSAO }],
    ['número do relatório', { arquivos: pdf, numero_do_relatorio: 2 }],
  ])('recusa o .pdf com %s', (_nome, mudancas) => {
    expect(codigoDe(entrada(mudancas))).toBe('entrada_invalida')
  })

  it('grava por registrar_pdf_da_aprovacao com o processo e o arquivo; a troca, por substituir_pdf_da_aprovacao com o .pdf e o que o Drive informou', () => {
    const novo = { ...base, arquivos: pdf.map(({ papel, drive_id: driveId }) => ({ papel: papel as 'pdf_da_aprovacao', driveId })) }
    expect(funcaoDoBancoPara(novo)).toBe('registrar_pdf_da_aprovacao')
    expect(parametrosDoBanco(novo, gravar)).toEqual({ p_processo: PROCESSO, p_arquivo: gravar[0] })
    const troca = { ...novo, arquivoId: ARQUIVO }
    expect(funcaoDoBancoPara(troca)).toBe('substituir_pdf_da_aprovacao')
    expect(parametrosDoBanco(troca, gravar)).toEqual({ p_pdf: ARQUIVO, p_novo: gravar[0] })
  })

  it('confere o nome no Drive: rótulo da versão aprovada e extensão .pdf', () => {
    const pedidos: ArquivoPedido[] = [{ papel: 'pdf_da_aprovacao', driveId: 'id-pdf' }]
    const conferir = (nome: string, rotulo: string | null) => conferirArquivosNoDrive(pedidos, [lido('id-pdf', nome)], PASTA, rotulo)
    const certo = conferir('CEE_V8_Nome_Aprovação.pdf', 'V8')
    expect(certo.ok && certo.valor[0]).toMatchObject({ papel: 'pdf_da_aprovacao', formato: 'pdf' })
    const outraVersao = conferir('CEE_V7_Nome_Aprovação.pdf', 'V8')
    expect(!outraVersao.ok && outraVersao.recusa.codigo).toBe('arquivo_nao_chegou')
    const docx = conferir('CEE_V8_Nome_Aprovação.docx', 'V8')
    expect(!docx.ok && docx.recusa.codigo).toBe('extensao_nao_aceita')
  })

  it('a recusa de aprovação inexistente e a do .pdf já enviado chegam como código e 409', () => {
    const semAprovacao = recusaDoBanco({ code: 'P0001', message: 'sem_aprovacao_para_o_pdf' })
    expect(semAprovacao).toEqual({ codigo: 'sem_aprovacao_para_o_pdf', mensagem: '' })
    expect(semAprovacao && statusDaRecusaDoBanco(semAprovacao)).toBe(409)
    expect(recusaDoBanco({ code: 'P0001', message: 'pdf_nome_sem_versao:a.pdf' })).toEqual({ codigo: 'pdf_nome_sem_versao', mensagem: 'a.pdf' })
  })
})
