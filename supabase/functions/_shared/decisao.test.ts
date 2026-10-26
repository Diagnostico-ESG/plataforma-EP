import { describe, expect, it } from 'vitest'
import {
  conferirChamador,
  conferirProcessoEmAndamento,
  extensaoDoNome,
  lerAcao,
  recusar,
  statusDaRecusa,
  LIMITE_DE_TAMANHO,
  validarBaixar,
  validarIniciarEnvio,
  type Acao,
  type Chamador,
  type CodigoDeRecusa,
} from './decisao.ts'

const administrador: Chamador = { perfil: 'administrador', ativo: true }
const integrante: Chamador = { perfil: 'integrante_ep', ativo: true }
const consulta: Chamador = { perfil: 'consulta', ativo: true }
const inativo: Chamador = { perfil: 'administrador', ativo: false }

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'

function entradaDeEnvio(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    processo_id: PROCESSO,
    papel: 'bpmn',
    nome_original: 'fluxo de teste.bpmn',
    tamanho: 1024,
    numero: 6,
    historica: false,
    ...mudancas,
  }
}

function codigoDaRecusa(entrada: unknown): CodigoDeRecusa | null {
  const resultado = validarIniciarEnvio(entrada)
  return resultado.ok ? null : resultado.recusa.codigo
}

describe('conferirChamador', () => {
  const casos: [string, Chamador | null, Acao, CodigoDeRecusa | null][] = [
    ['administrador envia', administrador, 'iniciar_envio', null],
    ['integrante envia', integrante, 'iniciar_envio', null],
    ['consulta não envia', consulta, 'iniciar_envio', 'sem_permissao'],
    ['inativo não envia', inativo, 'iniciar_envio', 'usuario_inativo'],
    ['sem login não envia', null, 'iniciar_envio', 'sem_login'],
    ['administrador baixa', administrador, 'baixar', null],
    ['integrante baixa', integrante, 'baixar', null],
    ['consulta baixa', consulta, 'baixar', null],
    ['inativo não baixa', inativo, 'baixar', 'usuario_inativo'],
    ['sem login não baixa', null, 'baixar', 'sem_login'],
    ['administrador registra', administrador, 'registrar', null],
    ['integrante registra', integrante, 'registrar', null],
    ['consulta não registra', consulta, 'registrar', 'sem_permissao'],
    ['inativo não registra', inativo, 'registrar', 'usuario_inativo'],
    ['sem login não registra', null, 'registrar', 'sem_login'],
    ['administrador confere', administrador, 'conferir', null],
    ['integrante confere', integrante, 'conferir', null],
    ['consulta confere', consulta, 'conferir', null],
    ['inativo não confere', inativo, 'conferir', 'usuario_inativo'],
    ['sem login não confere', null, 'conferir', 'sem_login'],
  ]

  it.each(casos)('%s', (_nome, chamador, acao, esperado) => {
    expect(conferirChamador(chamador, acao)?.codigo ?? null).toBe(esperado)
  })

  it('consulta inativa é recusada por estar inativa', () => {
    expect(conferirChamador({ perfil: 'consulta', ativo: false }, 'baixar')?.codigo).toBe('usuario_inativo')
  })
})

describe('conferirProcessoEmAndamento', () => {
  it('aceita o processo em andamento', () => {
    expect(conferirProcessoEmAndamento('em_andamento')).toBeNull()
  })

  it.each(['suspenso', 'cancelado', 'concluido'])('recusa o processo %s', (situacao) => {
    expect(conferirProcessoEmAndamento(situacao)?.codigo).toBe('processo_fora_de_andamento')
  })
})

describe('validarIniciarEnvio', () => {
  it('aceita a entrada válida e devolve os campos lidos', () => {
    expect(validarIniciarEnvio(entradaDeEnvio())).toEqual({
      ok: true,
      valor: {
        processoId: PROCESSO,
        papel: 'bpmn',
        nomeOriginal: 'fluxo de teste.bpmn',
        tamanho: 1024,
        numero: 6,
        historica: false,
        piloto: false,
        arquivoId: null,
        numeroDoRelatorio: null,
      },
    })
  })

  it('piloto é opcional: ausente vale falso, e true é lido (a versão piloto)', () => {
    const lido = (mudancas: Record<string, unknown>) => {
      const resultado = validarIniciarEnvio(entradaDeEnvio(mudancas))
      return resultado.ok ? resultado.valor.piloto : 'recusada'
    }
    expect(lido({})).toBe(false)
    expect(lido({ piloto: true })).toBe(true)
    expect(lido({ piloto: 'sim' })).toBe('recusada')
  })

  it('piloto junto com histórica é recusada como entrada inválida', () => {
    expect(codigoDaRecusa(entradaDeEnvio({ piloto: true, historica: true }))).toBe('entrada_invalida')
  })

  it('arquivo_id é opcional: ausente ou nulo vale null, e um uuid é lido (a substituição do arquivo)', () => {
    const ARQUIVO = '8f000000-0000-0000-0000-0000000000d1'
    const lido = (mudancas: Record<string, unknown>) => {
      const resultado = validarIniciarEnvio(entradaDeEnvio(mudancas))
      return resultado.ok ? resultado.valor.arquivoId : 'recusada'
    }
    expect(lido({})).toBeNull()
    expect(lido({ arquivo_id: null })).toBeNull()
    expect(lido({ arquivo_id: ARQUIVO })).toBe(ARQUIVO)
    expect(lido({ arquivo_id: 'a1' })).toBe('recusada')
    expect(lido({ arquivo_id: 7 })).toBe('recusada')
  })

  it('o relatório de versão que não é histórica exige o número do relatório e só aceita .docx', () => {
    const relatorio = { papel: 'relatorio', nome_original: 'relatorio.docx', numero_do_relatorio: 3 }
    const lido = (mudancas: Record<string, unknown>) => {
      const resultado = validarIniciarEnvio(entradaDeEnvio({ ...relatorio, ...mudancas }))
      return resultado.ok ? resultado.valor.numeroDoRelatorio : resultado.recusa.codigo
    }
    expect(lido({})).toBe(3)
    expect(lido({ numero_do_relatorio: undefined })).toBe('entrada_invalida')
    expect(lido({ numero_do_relatorio: 0 })).toBe('entrada_invalida')
    expect(lido({ numero_do_relatorio: '3' })).toBe('entrada_invalida')
    expect(lido({ nome_original: 'relatorio.pdf' })).toBe('extensao_nao_aceita')
  })

  it('o relatório da histórica e a troca do arquivo não têm número e aceitam .docx e .pdf', () => {
    const ARQUIVO = '8f000000-0000-0000-0000-0000000000d1'
    for (const nome of ['relatorio.docx', 'relatorio.pdf']) {
      expect(codigoDaRecusa(entradaDeEnvio({ papel: 'relatorio', nome_original: nome, historica: true }))).toBeNull()
      expect(codigoDaRecusa(entradaDeEnvio({ papel: 'relatorio', nome_original: nome, arquivo_id: ARQUIVO }))).toBeNull()
    }
    expect(codigoDaRecusa(entradaDeEnvio({ papel: 'relatorio', nome_original: 'r.docx', historica: true, numero_do_relatorio: 1 })))
      .toBe('entrada_invalida')
  })

  it('o número do relatório só vale no relatório', () => {
    expect(codigoDaRecusa(entradaDeEnvio({ numero_do_relatorio: 2 }))).toBe('entrada_invalida')
  })

  it.each([
    ['png', 'imagem.png'],
    ['bpm', 'fonte.bpm'],
    ['bpmn', 'FLUXO.BPMN'],
  ])('aceita o papel %s com %s', (papel, nome) => {
    expect(codigoDaRecusa(entradaDeEnvio({ papel, nome_original: nome }))).toBeNull()
  })

  it.each([
    ['relatorio', 'relatorio.png'],
    ['relatorio', 'relatorio.pdf'],
    ['bpmn', 'fluxo.xml'],
    ['png', 'imagem'],
  ])('recusa o papel %s com %s', (papel, nome) => {
    expect(codigoDaRecusa(entradaDeEnvio({ papel, nome_original: nome }))).toBe('extensao_nao_aceita')
  })

  it('aceita exatamente 20 MB e recusa um byte a mais', () => {
    expect(codigoDaRecusa(entradaDeEnvio({ tamanho: LIMITE_DE_TAMANHO }))).toBeNull()
    expect(codigoDaRecusa(entradaDeEnvio({ tamanho: LIMITE_DE_TAMANHO + 1 }))).toBe('arquivo_grande')
  })

  it.each([0, -1, 1.5, '1024'])('recusa o tamanho %s', (tamanho) => {
    expect(codigoDaRecusa(entradaDeEnvio({ tamanho }))).toBe('entrada_invalida')
  })

  it.each([
    ['processo_id que não é uuid', { processo_id: 'abc' }],
    ['papel desconhecido', { papel: 'outro' }],
    ['nome vazio', { nome_original: '   ' }],
    ['número zero', { numero: 0 }],
    ['número fracionário', { numero: 2.5 }],
    ['histórica que não é booleano', { historica: 'sim' }],
  ])('recusa %s', (_nome, mudancas) => {
    expect(codigoDaRecusa(entradaDeEnvio(mudancas))).toBe('entrada_invalida')
  })

  it.each(['processo_id', 'papel', 'nome_original', 'tamanho', 'numero', 'historica'])(
    'recusa a entrada sem %s',
    (campo) => {
      const entrada = entradaDeEnvio()
      delete entrada[campo]
      expect(codigoDaRecusa(entrada)).toBe('entrada_invalida')
    },
  )

  it.each([null, 'texto', [1, 2], 42])('recusa o corpo %s, que não é objeto', (corpo) => {
    expect(codigoDaRecusa(corpo)).toBe('entrada_invalida')
  })

  it('a mensagem nomeia o campo e o tipo recebido, sem o valor', () => {
    const resultado = validarIniciarEnvio(entradaDeEnvio({ processo_id: 'segredo-123' }))
    if (resultado.ok) throw new Error('esperada recusa')
    expect(resultado.recusa.mensagem).toContain('processo_id')
    expect(resultado.recusa.mensagem).toContain('string')
    expect(resultado.recusa.mensagem).not.toContain('segredo-123')
  })
})

describe('validarBaixar', () => {
  const ARQUIVO = '9f000000-0000-0000-0000-0000000000c1'

  it('aceita o identificador do arquivo da versão', () => {
    expect(validarBaixar({ arquivo_id: ARQUIVO })).toEqual({ ok: true, valor: { arquivoId: ARQUIVO } })
  })

  it.each([
    ['vazio', { arquivo_id: '' }],
    ['que não é uuid', { arquivo_id: "abc' or 1=1" }],
    ['que é um identificador do Drive', { arquivo_id: '1AbC_d-E2' }],
    ['que não é texto', { arquivo_id: 12 }],
    ['ausente', {}],
    ['corpo nulo', null],
  ])('recusa o identificador %s', (_nome, entrada) => {
    const resultado = validarBaixar(entrada)
    expect(resultado.ok ? null : resultado.recusa.codigo).toBe('entrada_invalida')
  })
})

describe('extensaoDoNome', () => {
  it.each([
    ['fluxo.BPMN', 'bpmn'],
    ['relatorio.final.pdf', 'pdf'],
    ['sem extensao', ''],
    ['termina em ponto.', ''],
  ])('%s → %s', (nome, esperado) => {
    expect(extensaoDoNome(nome)).toBe(esperado)
  })
})

describe('lerAcao', () => {
  it.each(['iniciar_envio', 'baixar', 'registrar', 'conferir'])('lê a ação %s', (acao) => {
    expect(lerAcao({ acao })).toBe(acao)
  })

  it('a ação sem_alteracao saiu (ADR 0026)', () => {
    expect(lerAcao({ acao: 'sem_alteracao' })).toBeNull()
  })

  it.each([null, 'baixar', {}, { acao: 'apagar' }, { acao: 3 }, { acao: 'constructor' }])('devolve null para %j', (corpo) => {
    expect(lerAcao(corpo)).toBeNull()
  })
})

describe('statusDaRecusa', () => {
  it.each([
    ['sem_login', 401],
    ['usuario_inativo', 403],
    ['sem_permissao', 403],
    ['entrada_invalida', 400],
    ['processo_fora_de_andamento', 400],
    ['extensao_nao_aceita', 400],
    ['arquivo_grande', 400],
  ] as const)('%s → %i', (codigo, status) => {
    expect(statusDaRecusa(recusar(codigo))).toBe(status)
  })
})
