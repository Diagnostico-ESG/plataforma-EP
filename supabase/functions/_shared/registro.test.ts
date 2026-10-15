import { describe, expect, it } from 'vitest'
import { LIMITE_DE_TAMANHO } from './decisao.ts'
import {
  conferirArquivosNoDrive,
  recusaDoBanco,
  statusDaRecusaDoBanco,
  validarRegistrar,
  type ArquivoNoDrive,
  type ArquivoPedido,
} from './registro.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'
const PASTA = 'pasta-do-processo'
const MD5 = '0123456789abcdef0123456789abcdef'

function entrada(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    processo_id: PROCESSO,
    numero: 3,
    observacao: 'Corrigido o fluxo',
    arquivos: [{ papel: 'bpmn', drive_id: 'id-bpmn' }, { papel: 'png', drive_id: 'id-png' }],
    ...mudancas,
  }
}

function codigoDe(corpo: unknown): string | null {
  const resultado = validarRegistrar(corpo)
  return resultado.ok ? null : resultado.recusa.codigo
}

describe('validarRegistrar', () => {
  it('aceita a entrada válida e devolve os campos lidos', () => {
    expect(validarRegistrar(entrada())).toEqual({
      ok: true,
      valor: {
        processoId: PROCESSO,
        numero: 3,
        observacao: 'Corrigido o fluxo',
        arquivos: [{ papel: 'bpmn', driveId: 'id-bpmn' }, { papel: 'png', driveId: 'id-png' }],
      },
    })
  })

  it('observação ausente ou nula vira null', () => {
    const semObservacao = validarRegistrar(entrada({ observacao: undefined }))
    expect(semObservacao.ok && semObservacao.valor.observacao).toBeNull()
    const nula = validarRegistrar(entrada({ observacao: null }))
    expect(nula.ok && nula.valor.observacao).toBeNull()
  })

  it.each([
    ['corpo que não é objeto', 'texto'],
    ['processo fora do formato', entrada({ processo_id: 'p1' })],
    ['número zero', entrada({ numero: 0 })],
    ['observação de outro tipo', entrada({ observacao: 5 })],
    ['observação com mais de 2.000 caracteres', entrada({ observacao: 'a'.repeat(2001) })],
    ['arquivos que não são lista', entrada({ arquivos: 'id' })],
    ['lista de arquivos vazia', entrada({ arquivos: [] })],
    ['mais de quatro arquivos', entrada({ arquivos: Array.from({ length: 5 }, () => ({ papel: 'bpmn', drive_id: 'x' })) })],
    ['arquivo que não é objeto', entrada({ arquivos: ['id'] })],
    ['papel desconhecido', entrada({ arquivos: [{ papel: 'eml', drive_id: 'x' }] })],
    ['drive_id fora do formato', entrada({ arquivos: [{ papel: 'bpmn', drive_id: 'a/b' }] })],
    ['papel repetido', entrada({ arquivos: [{ papel: 'bpmn', drive_id: 'a' }, { papel: 'bpmn', drive_id: 'b' }] })],
  ])('recusa %s como entrada inválida', (_nome, corpo) => {
    expect(codigoDe(corpo)).toBe('entrada_invalida')
  })

  it('aceita observação de exatamente 2.000 caracteres', () => {
    expect(codigoDe(entrada({ observacao: 'a'.repeat(2000) }))).toBeNull()
  })
})

const PEDIDOS: ArquivoPedido[] = [{ papel: 'bpmn', driveId: 'id-bpmn' }, { papel: 'png', driveId: 'id-png' }]

function lido(id: string, nome: string, mudancas: Partial<ArquivoNoDrive> = {}): ArquivoNoDrive {
  return { id, name: nome, size: '1024', md5Checksum: MD5, parents: [PASTA], ...mudancas }
}

const LIDOS = [lido('id-bpmn', 'TSA_V3_Emitir Ofício.bpmn'), lido('id-png', 'TSA_V3_Emitir Ofício.png')]

function codigoDaConferencia(lidos: (ArquivoNoDrive | null)[], pedidos: ArquivoPedido[] = PEDIDOS): string | null {
  const resultado = conferirArquivosNoDrive(pedidos, lidos, PASTA)
  return resultado.ok ? null : resultado.recusa.codigo
}

describe('conferirArquivosNoDrive', () => {
  it('devolve os arquivos como o banco os grava, com o nome, o tamanho e o MD5 informados pelo Drive', () => {
    expect(conferirArquivosNoDrive(PEDIDOS, LIDOS, PASTA)).toEqual({
      ok: true,
      valor: [
        { papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn', formato: 'bpmn', tamanho: 1024, hash_md5: MD5, drive_id: 'id-bpmn' },
        { papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 1024, hash_md5: MD5, drive_id: 'id-png' },
      ],
    })
  })

  it('aceita o relatório .pdf e o .docx', () => {
    const pedidos: ArquivoPedido[] = [{ papel: 'relatorio', driveId: 'id-rel' }]
    expect(codigoDaConferencia([lido('id-rel', 'TSA_V3_P_Relatório.pdf')], pedidos)).toBeNull()
    expect(codigoDaConferencia([lido('id-rel', 'TSA_V3_P_Relatório.docx')], pedidos)).toBeNull()
  })

  it('recusa o arquivo que não chegou ao Drive', () => {
    expect(codigoDaConferencia([LIDOS[0], null])).toBe('arquivo_nao_chegou')
  })

  it('recusa o arquivo sem MD5 (envio incompleto)', () => {
    expect(codigoDaConferencia([LIDOS[0], lido('id-png', 'x.png', { md5Checksum: undefined })])).toBe('arquivo_nao_chegou')
  })

  it('aceita exatamente 20 MB no Drive e recusa um byte a mais', () => {
    const tamanho = (bytes: number) => [LIDOS[0], lido('id-png', 'x.png', { size: String(bytes) })]
    expect(codigoDaConferencia(tamanho(LIMITE_DE_TAMANHO))).toBeNull()
    expect(codigoDaConferencia(tamanho(LIMITE_DE_TAMANHO + 1))).toBe('arquivo_grande')
  })

  it('recusa o nome no Drive com extensão diferente do papel', () => {
    expect(codigoDaConferencia([LIDOS[0], lido('id-png', 'x.jpg')])).toBe('extensao_nao_aceita')
  })

  it('recusa o arquivo fora da pasta do processo', () => {
    expect(codigoDaConferencia([LIDOS[0], lido('id-png', 'x.png', { parents: ['outra'] })])).toBe('arquivo_fora_da_pasta')
    expect(codigoDaConferencia([LIDOS[0], lido('id-png', 'x.png', { parents: undefined })])).toBe('arquivo_fora_da_pasta')
  })

  it('recusa o arquivo lido que não é o pedido', () => {
    expect(codigoDaConferencia([LIDOS[0], lido('outro-id', 'x.png')])).toBe('arquivo_nao_chegou')
  })
})

describe('recusaDoBanco', () => {
  it('a recusa "motivo:valor" do banco vira código e valor', () => {
    expect(recusaDoBanco({ code: 'P0001', message: 'numero_da_versao_mudou:4' })).toEqual({
      codigo: 'numero_da_versao_mudou',
      mensagem: '4',
    })
  })

  it('a recusa sem valor vira só o código', () => {
    expect(recusaDoBanco({ code: 'P0001', message: 'versao_sem_bpmn_e_png' })).toEqual({
      codigo: 'versao_sem_bpmn_e_png',
      mensagem: '',
    })
  })

  it('a falta de privilégio vira "sem permissão"', () => {
    expect(recusaDoBanco({ code: '42501', message: 'new row violates row-level security policy' })?.codigo).toBe('sem_permissao')
  })

  it('sem permissão é 403; a regra do banco, 409', () => {
    expect(statusDaRecusaDoBanco({ codigo: 'sem_permissao', mensagem: '' })).toBe(403)
    expect(statusDaRecusaDoBanco({ codigo: 'versao_sem_bpmn_e_png', mensagem: '' })).toBe(409)
  })

  it('outro erro do banco não é recusa (vira erro interno)', () => {
    expect(recusaDoBanco({ code: '08006', message: 'conexão caiu' })).toBeNull()
  })
})
