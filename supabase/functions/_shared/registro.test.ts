import { describe, expect, it } from 'vitest'
import { LIMITE_DE_TAMANHO } from './decisao.ts'
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

describe('validarRegistrar', () => {
  it('aceita a entrada válida e devolve os campos lidos', () => {
    expect(validarRegistrar(entrada())).toEqual({
      ok: true,
      valor: {
        processoId: PROCESSO,
        numero: 3,
        historica: false,
        piloto: false,
        versaoId: null,
        arquivoId: null,
        arquivos: [{ papel: 'bpmn', driveId: 'id-bpmn' }, { papel: 'png', driveId: 'id-png' }],
      },
    })
  })

  it('piloto ausente vale falso; true é lido como veio', () => {
    const ausente = validarRegistrar(entrada())
    expect(ausente.ok && ausente.valor.piloto).toBe(false)
    const verdadeira = validarRegistrar(entrada({ piloto: true }))
    expect(verdadeira.ok && verdadeira.valor.piloto).toBe(true)
  })

  it('piloto junto com histórica é recusada como entrada inválida', () => {
    expect(codigoDe(entrada({ piloto: true, historica: true }))).toBe('entrada_invalida')
  })

  it('piloto de tipo errado é recusada, citando o tipo recebido', () => {
    const resultado = validarRegistrar(entrada({ piloto: 'sim' }))
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.recusa.mensagem).toContain('campo piloto: esperado booleano')
  })

  it('historica ausente vale falso; true e false são lidos como vieram', () => {
    const ausente = validarRegistrar(entrada())
    expect(ausente.ok && ausente.valor.historica).toBe(false)
    const verdadeira = validarRegistrar(entrada({ historica: true }))
    expect(verdadeira.ok && verdadeira.valor.historica).toBe(true)
    const falsa = validarRegistrar(entrada({ historica: false }))
    expect(falsa.ok && falsa.valor.historica).toBe(false)
  })

  it.each([
    ['texto', 'sim'],
    ['número', 1],
    ['nulo', null],
  ])('historica %s é recusada como entrada inválida, citando o tipo recebido', (_nome, valor) => {
    const resultado = validarRegistrar(entrada({ historica: valor }))
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.recusa.codigo).toBe('entrada_invalida')
    expect(resultado.recusa.mensagem).toContain('campo historica: esperado booleano')
  })

  it.each([
    ['corpo que não é objeto', 'texto'],
    ['processo fora do formato', entrada({ processo_id: 'p1' })],
    ['número zero', entrada({ numero: 0 })],
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

describe('arquivo depois (versao_id)', () => {
  const VERSAO = '8f000000-0000-0000-0000-0000000000c1'
  const relatorio = [{ papel: 'relatorio', drive_id: 'id-relatorio' }]

  it('lê o versao_id e o único arquivo, o relatório', () => {
    const resultado = validarRegistrar(entrada({ versao_id: VERSAO, arquivos: relatorio }))
    expect(resultado.ok && resultado.valor.versaoId).toBe(VERSAO)
  })

  it('versao_id ausente ou nulo vale null', () => {
    const ausente = validarRegistrar(entrada())
    expect(ausente.ok && ausente.valor.versaoId).toBeNull()
    const nulo = validarRegistrar(entrada({ versao_id: null }))
    expect(nulo.ok && nulo.valor.versaoId).toBeNull()
  })

  it.each([
    ['versao_id que não é uuid', { versao_id: 'v1', arquivos: relatorio }],
    ['versao_id de tipo errado', { versao_id: 7, arquivos: relatorio }],
    ['mais de um arquivo', { versao_id: VERSAO }],
    ['arquivo .bpm, que não se acrescenta depois', { versao_id: VERSAO, arquivos: [{ papel: 'bpm', drive_id: 'id-bpm' }] }],
    ['histórica', { versao_id: VERSAO, arquivos: relatorio, historica: true }],
  ])('recusa %s', (_nome, mudancas) => {
    expect(codigoDe(entrada(mudancas))).toBe('entrada_invalida')
  })

  it.each(['png', 'bpmn'])('aceita o %s como único arquivo (acrescentar depois), de versão piloto ou não', (papel) => {
    const arquivos = [{ papel, drive_id: 'id-novo' }]
    expect(codigoDe(entrada({ versao_id: VERSAO, arquivos }))).toBeNull()
    expect(codigoDe(entrada({ versao_id: VERSAO, arquivos, piloto: true }))).toBeNull()
  })

  it('o tipo errado do versao_id aparece na mensagem, sem o valor', () => {
    const resultado = validarRegistrar(entrada({ versao_id: 7, arquivos: relatorio }))
    expect(!resultado.ok && resultado.recusa.mensagem).toContain('versao_id')
    expect(!resultado.ok && resultado.recusa.mensagem).toContain('number')
  })
})

describe('funcaoDoBancoPara e parametrosDoBanco', () => {
  const VERSAO = '8f000000-0000-0000-0000-0000000000c1'
  const gravar = [{ papel: 'relatorio' as const, nome: 'a.pdf', formato: 'pdf', tamanho: 1, hash_md5: MD5, drive_id: 'x' }]

  const base = { historica: false, versaoId: null, arquivoId: null, arquivos: [] }

  it('a nova e a piloto gravam por registrar_versao, a histórica por registrar_versao_historica, o relatório por acrescentar_relatorio e o .png ou .bpmn por acrescentar_arquivo', () => {
    expect(funcaoDoBancoPara(base)).toBe('registrar_versao')
    expect(funcaoDoBancoPara({ ...base, historica: true })).toBe('registrar_versao_historica')
    const relatorioDepois = { ...base, versaoId: VERSAO, arquivos: [{ papel: 'relatorio' as const, driveId: 'x' }] }
    expect(funcaoDoBancoPara(relatorioDepois)).toBe('acrescentar_relatorio')
    const pngDepois = { ...base, versaoId: VERSAO, arquivos: [{ papel: 'png' as const, driveId: 'x' }] }
    expect(funcaoDoBancoPara(pngDepois)).toBe('acrescentar_arquivo')
  })

  it('os parâmetros seguem a função: versão nova ou piloto levam o processo e p_piloto; a histórica, o processo; o relatório, a versão e o arquivo; o .png ou .bpmn, a versão e o arquivo', () => {
    const entradaBase = { processoId: PROCESSO, numero: 3, historica: false, piloto: false, arquivoId: null, arquivos: [] }
    expect(parametrosDoBanco({ ...entradaBase, versaoId: null }, gravar)).toEqual({
      p_processo: PROCESSO, p_numero: 3, p_arquivos: gravar, p_piloto: false,
    })
    expect(parametrosDoBanco({ ...entradaBase, piloto: true, versaoId: null }, gravar)).toEqual({
      p_processo: PROCESSO, p_numero: 3, p_arquivos: gravar, p_piloto: true,
    })
    expect(parametrosDoBanco({ ...entradaBase, historica: true, versaoId: null }, gravar)).toEqual({
      p_processo: PROCESSO, p_numero: 3, p_arquivos: gravar,
    })
    const relatorioDepois = { ...entradaBase, versaoId: VERSAO, arquivos: [{ papel: 'relatorio' as const, driveId: 'x' }] }
    expect(parametrosDoBanco(relatorioDepois, gravar)).toEqual({ p_versao: VERSAO, p_numero: 3, p_arquivo: gravar[0] })
    const pngDepois = { ...entradaBase, versaoId: VERSAO, arquivos: [{ papel: 'png' as const, driveId: 'x' }] }
    expect(parametrosDoBanco(pngDepois, gravar)).toEqual({ p_versao: VERSAO, p_arquivo: gravar[0] })
  })
})

describe('substituição do arquivo (arquivo_id)', () => {
  const ARQUIVO = '8f000000-0000-0000-0000-0000000000d1'
  const VERSAO = '8f000000-0000-0000-0000-0000000000c1'
  const png = [{ papel: 'png', drive_id: 'id-png' }]
  const gravar = [{ papel: 'png' as const, nome: 'a.png', formato: 'png', tamanho: 9, hash_md5: MD5, drive_id: 'id-png' }]

  it('lê o arquivo_id e o único arquivo, de qualquer papel', () => {
    const resultado = validarRegistrar(entrada({ arquivo_id: ARQUIVO, arquivos: png }))
    expect(resultado.ok && resultado.valor.arquivoId).toBe(ARQUIVO)
  })

  it.each([
    ['arquivo_id que não é uuid', { arquivo_id: 'a1', arquivos: png }],
    ['mais de um arquivo', { arquivo_id: ARQUIVO }],
    ['histórica', { arquivo_id: ARQUIVO, arquivos: png, historica: true }],
    ['versao_id junto', { arquivo_id: ARQUIVO, arquivos: png, versao_id: VERSAO }],
  ])('recusa %s', (_nome, mudancas) => {
    expect(codigoDe(entrada(mudancas))).toBe('entrada_invalida')
  })

  it('grava por substituir_arquivo, com o arquivo e o que o Drive informou dele', () => {
    const base = { processoId: PROCESSO, numero: 3, historica: false, piloto: false, versaoId: null, arquivos: [] }
    const substituicao = { ...base, arquivoId: ARQUIVO }
    expect(funcaoDoBancoPara(substituicao)).toBe('substituir_arquivo')
    expect(parametrosDoBanco(substituicao, gravar)).toEqual({ p_arquivo: ARQUIVO, p_novo: gravar[0] })
  })

  it('a recusa do formato diferente chega como código e 409', () => {
    const recusa = recusaDoBanco({ code: 'P0001', message: 'tipo_de_arquivo_diferente:pdf' })
    expect(recusa).toEqual({ codigo: 'tipo_de_arquivo_diferente', mensagem: 'pdf' })
    expect(recusa && statusDaRecusaDoBanco(recusa)).toBe(409)
  })
})

describe('recusaDoBanco', () => {
  it.each([
    ['historica_depois_de_versao_nova', 'historica_depois_de_versao_nova', ''],
    ['numero_historico_repetido:5', 'numero_historico_repetido', '5'],
    ['historica_sem_arquivo_de_fluxograma', 'historica_sem_arquivo_de_fluxograma', ''],
    ['relatorio_ja_existe', 'relatorio_ja_existe', ''],
    ['versao_anterior_sem_relatorio', 'versao_anterior_sem_relatorio', ''],
    ['copia_de_versao_que_nao_e_a_anterior', 'copia_de_versao_que_nao_e_a_anterior', ''],
    ['copia_diferente_do_original', 'copia_diferente_do_original', ''],
    ['versao_historica_somente_leitura', 'versao_historica_somente_leitura', ''],
    ['numero_da_piloto_nao_maior:6', 'numero_da_piloto_nao_maior', '6'],
    ['piloto_depois_de_versao_em_sequencia', 'piloto_depois_de_versao_em_sequencia', ''],
    ['piloto_fora_da_etapa', 'piloto_fora_da_etapa', ''],
    ['versao_fora_da_etapa', 'versao_fora_da_etapa', ''],
    ['historica_fora_de_nao_iniciados', 'historica_fora_de_nao_iniciados', ''],
    ['arquivo_ja_existe', 'arquivo_ja_existe', ''],
    ['papel_nao_acrescentavel', 'papel_nao_acrescentavel', ''],
  ])('a recusa %s do banco chega com o motivo como código e o valor como mensagem (409)', (texto, codigo, valor) => {
    const recusa = recusaDoBanco({ code: 'P0001', message: texto })
    expect(recusa).toEqual({ codigo, mensagem: valor })
    expect(statusDaRecusaDoBanco(recusa as { codigo: string; mensagem: string })).toBe(409)
  })

  it('a recusa "motivo:valor" do banco vira código e valor', () => {
    expect(recusaDoBanco({ code: 'P0001', message: 'numero_da_versao_mudou:4' })).toEqual({
      codigo: 'numero_da_versao_mudou',
      mensagem: '4',
    })
  })

  it('a recusa sem valor vira só o código', () => {
    expect(recusaDoBanco({ code: 'P0001', message: 'versao_sem_bpm' })).toEqual({
      codigo: 'versao_sem_bpm',
      mensagem: '',
    })
  })

  it('a falta de privilégio vira "sem permissão"', () => {
    expect(recusaDoBanco({ code: '42501', message: 'new row violates row-level security policy' })?.codigo).toBe('sem_permissao')
  })

  it('sem permissão é 403; a regra do banco, 409', () => {
    expect(statusDaRecusaDoBanco({ codigo: 'sem_permissao', mensagem: '' })).toBe(403)
    expect(statusDaRecusaDoBanco({ codigo: 'versao_sem_bpm', mensagem: '' })).toBe(409)
  })

  it('outro erro do banco não é recusa (vira erro interno)', () => {
    expect(recusaDoBanco({ code: '08006', message: 'conexão caiu' })).toBeNull()
  })
})

describe('conferirArquivosNoDrive: rótulo da versão no nome e arquivo vazio', () => {
  const pedidos: ArquivoPedido[] = [{ papel: 'bpm', driveId: 'id-bpm' }]

  function conferirComRotulo(nome: string, rotulo: string | null, mudancas: Partial<ArquivoNoDrive> = {}) {
    return conferirArquivosNoDrive(pedidos, [lido('id-bpm', nome, mudancas)], PASTA, rotulo)
  }

  function recusaDe(resultado: ReturnType<typeof conferirComRotulo>): { codigo: string; mensagem: string } | null {
    return resultado.ok ? null : resultado.recusa
  }

  it('aceita o nome que tem o rótulo da versão pedida', () => {
    expect(recusaDe(conferirComRotulo('TSA_V5_Emitir Ofício.bpm', 'V5'))).toBeNull()
    expect(recusaDe(conferirComRotulo('TSA_V5F_Emitir Ofício.bpm', 'V5F'))).toBeNull()
  })

  it('recusa o nome de outra versão ou sem o F da histórica, citando o recebido e o esperado', () => {
    const recusa = recusaDe(conferirComRotulo('TSA_V5_Emitir Ofício.bpm', 'V5F'))
    expect(recusa?.codigo).toBe('arquivo_nao_chegou')
    expect(recusa?.mensagem).toContain('nome TSA_V5_Emitir Ofício.bpm; esperado o rótulo V5F')
    expect(recusaDe(conferirComRotulo('TSA_V6_Emitir Ofício.bpm', 'V5'))?.codigo).toBe('arquivo_nao_chegou')
  })

  it('sem rótulo (substituição, em que o nome fica) não confere o nome', () => {
    expect(recusaDe(conferirComRotulo('TSA_V9_Emitir Ofício.bpm', null))).toBeNull()
  })

  it('recusa arquivo vazio no Drive', () => {
    expect(recusaDe(conferirComRotulo('TSA_V5_Emitir Ofício.bpm', 'V5', { size: '0' }))?.codigo).toBe('arquivo_nao_chegou')
  })
})
