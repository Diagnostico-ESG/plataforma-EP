import { describe, expect, it } from 'vitest'
import { conferirChamador, conferirProcessoEmAndamento, lerAcao } from './decisao.ts'
import {
  RECUSA_DE_RENOMEACAO_INCOMPLETA, arquivosParaRenomear, conferirNumeroDaVersao, nomeComORotuloNovo, recusaDeRenomeacaoNoDrive,
  rotuloDaVersao, validarRenumerar, type VersaoDoProcesso,
} from './renumerar.ts'

const UUID = '3f2b8c1e-0000-4000-8000-000000000001'
const EM_SEQUENCIA: VersaoDoProcesso = { numero: 5, historica: false, piloto: false }

describe('quem pode renumerar (perfil e situação)', () => {
  it.each([
    ['administrador', true, null],
    ['integrante_ep', true, null],
    ['consulta', true, 'sem_permissao'],
    ['administrador', false, 'usuario_inativo'],
  ] as const)('%s ativo=%s -> %s', (perfil, ativo, esperado) => {
    expect(conferirChamador({ perfil, ativo }, 'renumerar')?.codigo ?? null).toBe(esperado)
  })

  it('visitante sem login é recusado', () => {
    expect(conferirChamador(null, 'renumerar')?.codigo).toBe('sem_login')
  })

  it('a ação é reconhecida e só o processo em andamento passa', () => {
    expect(lerAcao({ acao: 'renumerar' })).toBe('renumerar')
    expect(conferirProcessoEmAndamento('em_andamento')).toBeNull()
    for (const situacao of ['suspenso', 'cancelado', 'concluido']) {
      expect(conferirProcessoEmAndamento(situacao)?.codigo).toBe('processo_fora_de_andamento')
    }
  })
})

describe('validarRenumerar', () => {
  it('aceita a versão, o número visto e o número novo', () => {
    expect(validarRenumerar({ versao_id: UUID, numero_esperado: 7, numero_novo: 5 })).toEqual({
      ok: true, valor: { versaoId: UUID, numeroEsperado: 7, numeroNovo: 5 },
    })
  })

  it.each([
    [{ versao_id: 'nao-e-uuid', numero_esperado: 7, numero_novo: 5 }, 'versao_id'],
    [{ versao_id: UUID, numero_esperado: 0, numero_novo: 5 }, 'numero_esperado'],
    [{ versao_id: UUID, numero_esperado: 7, numero_novo: 0 }, 'numero_novo'],
    [{ versao_id: UUID, numero_esperado: 7, numero_novo: 5.5 }, 'numero_novo'],
    [{ versao_id: UUID, numero_esperado: 7, numero_novo: '5' }, 'numero_novo'],
    [{ versao_id: UUID, numero_esperado: 7, numero_novo: 7 }, 'numero_novo'],
  ])('recusa %j, citando o campo %s', (corpo, campo) => {
    const resultado = validarRenumerar(corpo)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.recusa.mensagem).toContain(campo)
  })

  it('recusa corpo que não é objeto, dizendo o que recebeu', () => {
    const resultado = validarRenumerar(null)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.recusa.mensagem).toContain('recebido null')
  })
})

describe('conferirNumeroDaVersao', () => {
  const doProcesso: VersaoDoProcesso[] = [
    { numero: 3, historica: true, piloto: false }, { numero: 4, historica: false, piloto: true }, EM_SEQUENCIA,
  ]

  it('deixa passar o número livre', () => {
    expect(conferirNumeroDaVersao(EM_SEQUENCIA, { numeroEsperado: 5, numeroNovo: 8 }, doProcesso)).toBeNull()
  })

  it('recusa o número que outra pessoa já mudou, com o atual', () => {
    expect(conferirNumeroDaVersao(EM_SEQUENCIA, { numeroEsperado: 6, numeroNovo: 8 }, doProcesso))
      .toEqual({ codigo: 'numero_da_versao_alterado', mensagem: '5' })
  })

  it('recusa o número de outra versão, com o rótulo dela', () => {
    expect(conferirNumeroDaVersao(EM_SEQUENCIA, { numeroEsperado: 5, numeroNovo: 3 }, doProcesso))
      .toEqual({ codigo: 'numero_ja_usado', mensagem: 'V3F' })
    expect(conferirNumeroDaVersao(EM_SEQUENCIA, { numeroEsperado: 5, numeroNovo: 4 }, doProcesso))
      .toEqual({ codigo: 'numero_ja_usado', mensagem: 'V4P' })
  })
})

describe('recusas da renomeação no Drive', () => {
  it('a falha diz o rótulo que continua valendo, e a volta incompleta pede para repetir a edição', () => {
    expect(recusaDeRenomeacaoNoDrive('V5F')).toEqual({ codigo: 'renomeacao_no_drive_falhou', mensagem: 'V5F' })
    expect(RECUSA_DE_RENOMEACAO_INCOMPLETA.codigo).toBe('renomeacao_incompleta')
  })
})

describe('nome dos arquivos', () => {
  it('troca só o primeiro rótulo, mantendo o Relatório V2 e o resto do nome', () => {
    expect(nomeComORotuloNovo('CEE_V5_Compras_Relatório V2.docx', '_V5_', '_V7_')).toBe('CEE_V7_Compras_Relatório V2.docx')
  })

  it('deixa como está o nome sem o rótulo', () => {
    expect(nomeComORotuloNovo('planilha.xlsx', '_V5_', '_V7_')).toBe('planilha.xlsx')
  })

  it('dá o rótulo com a letra do tipo', () => {
    expect(rotuloDaVersao({ numero: 2, historica: true, piloto: false })).toBe('V2F')
    expect(rotuloDaVersao({ numero: 9, historica: false, piloto: true })).toBe('V9P')
    expect(rotuloDaVersao(EM_SEQUENCIA)).toBe('V5')
  })

  it('lista só os arquivos cujo nome muda, na piloto com a letra P', () => {
    const piloto: VersaoDoProcesso = { numero: 4, historica: false, piloto: true }
    const arquivos = [
      { drive_id: 'a', nome: 'T65_V4P_Compras.bpm' },
      { drive_id: 'b', nome: 'T65_V4P_Compras_Relatório V1.docx' },
      { drive_id: 'c', nome: 'sem-rotulo.png' },
    ]
    expect(arquivosParaRenomear(arquivos, piloto, 9)).toEqual([
      { driveId: 'a', nomeAntigo: 'T65_V4P_Compras.bpm', nomeNovo: 'T65_V9P_Compras.bpm' },
      { driveId: 'b', nomeAntigo: 'T65_V4P_Compras_Relatório V1.docx', nomeNovo: 'T65_V9P_Compras_Relatório V1.docx' },
    ])
  })

  it('não confunde V5 com V5F no mesmo processo', () => {
    expect(arquivosParaRenomear([{ drive_id: 'a', nome: 'T_V5F_X.bpm' }], EM_SEQUENCIA, 8)).toEqual([])
  })
})
