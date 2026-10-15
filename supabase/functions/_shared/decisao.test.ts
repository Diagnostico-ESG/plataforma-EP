import { describe, expect, it } from 'vitest'
import {
  conferirChamador,
  conferirProcessoEmAndamento,
  extensaoDoNome,
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
      },
    })
  })

  it.each([
    ['png', 'imagem.png'],
    ['bpm', 'fonte.bpm'],
    ['relatorio', 'relatorio.docx'],
    ['relatorio', 'relatorio.pdf'],
    ['bpmn', 'FLUXO.BPMN'],
  ])('aceita o papel %s com %s', (papel, nome) => {
    expect(codigoDaRecusa(entradaDeEnvio({ papel, nome_original: nome }))).toBeNull()
  })

  it.each([
    ['relatorio', 'relatorio.png'],
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
  it('aceita o identificador do Drive', () => {
    expect(validarBaixar({ drive_id: '1AbC_d-E2' })).toEqual({ ok: true, valor: { driveId: '1AbC_d-E2' } })
  })

  it.each([
    ['vazio', { drive_id: '' }],
    ['com caractere estranho', { drive_id: "abc' or 1=1" }],
    ['longo demais', { drive_id: 'a'.repeat(201) }],
    ['que não é texto', { drive_id: 12 }],
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
