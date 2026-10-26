import { describe, expect, it } from 'vitest'
import type { Validacao } from './decisao.ts'
import { conferirAlvoDoEnvio, conferirAlvoDoRegistro, conferirVersaoDoProcesso, type AlvoDaSubstituicao } from './substituicao.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'

const alvo: AlvoDaSubstituicao = {
  papel: 'relatorio', formato: 'pdf', nome: 'TSA_V3_Emitir Ofício_Relatório.pdf', driveId: 'drive-do-relatorio',
  processoId: PROCESSO, historica: false, aprovada: false, numero: 3,
}

const pedidoDeEnvio = { processoId: PROCESSO, papel: 'relatorio' as const, nomeOriginal: 'novo relatório.PDF' }
const pedidoDeRegistro = { processoId: PROCESSO, driveId: 'drive-do-relatorio' }

function codigo(resultado: Validacao<unknown>): string | null {
  return resultado.ok ? null : resultado.recusa.codigo
}

function mensagem(resultado: Validacao<unknown>): string {
  return resultado.ok ? '' : resultado.recusa.mensagem
}

describe('conferirAlvoDoEnvio', () => {
  it('aceita o arquivo do processo, de versão nova, com o mesmo papel e a mesma extensão (sem importar maiúsculas)', () => {
    expect(conferirAlvoDoEnvio(alvo, pedidoDeEnvio)).toEqual({ ok: true, valor: alvo })
  })

  it('recusa arquivo que não existe ou que é de outro processo, sem dizer qual dos dois', () => {
    expect(codigo(conferirAlvoDoEnvio(null, pedidoDeEnvio))).toBe('entrada_invalida')
    const outro = { ...pedidoDeEnvio, processoId: '9f000000-0000-0000-0000-0000000000b2' }
    expect(codigo(conferirAlvoDoEnvio(alvo, outro))).toBe('entrada_invalida')
  })

  it('recusa arquivo de versão histórica', () => {
    expect(codigo(conferirAlvoDoEnvio({ ...alvo, historica: true }, pedidoDeEnvio))).toBe('versao_historica_somente_leitura')
  })

  it('o relatório numerado (.docx) se substitui por outro .docx; o ligado à versão aprovada, não', () => {
    const numerado = { ...alvo, formato: 'docx', nome: 'TSA_V3_Emitir Ofício_Relatório V2.docx' }
    const novo = { ...pedidoDeEnvio, nomeOriginal: 'relatório revisado.docx' }
    expect(codigo(conferirAlvoDoEnvio(numerado, novo))).toBeNull()
    expect(codigo(conferirAlvoDoEnvio(numerado, pedidoDeEnvio))).toBe('tipo_de_arquivo_diferente')
    expect(codigo(conferirAlvoDoEnvio({ ...numerado, aprovada: true }, novo))).toBe('versao_aprovada')
  })

  it('recusa arquivo de versão aprovada, citando o número da versão, antes de o arquivo subir ao Drive', () => {
    const recusa = conferirAlvoDoEnvio({ ...alvo, aprovada: true }, pedidoDeEnvio)
    expect(codigo(recusa)).toBe('versao_aprovada')
    expect(mensagem(recusa)).toContain('(3)')
  })

  it('recusa papel diferente, citando o recebido e o esperado', () => {
    const recusa = conferirAlvoDoEnvio(alvo, { ...pedidoDeEnvio, papel: 'png' })
    expect(codigo(recusa)).toBe('tipo_de_arquivo_diferente')
    expect(mensagem(recusa)).toContain('png')
    expect(mensagem(recusa)).toContain('relatorio')
  })

  it('recusa extensão diferente, citando a recebida e a esperada', () => {
    const recusa = conferirAlvoDoEnvio(alvo, { ...pedidoDeEnvio, nomeOriginal: 'novo.docx' })
    expect(codigo(recusa)).toBe('tipo_de_arquivo_diferente')
    expect(mensagem(recusa)).toContain('.docx')
    expect(mensagem(recusa)).toContain('.pdf')
  })
})

describe('conferirAlvoDoRegistro', () => {
  it('aceita o pedido cujo drive_id é o do arquivo a substituir', () => {
    expect(conferirAlvoDoRegistro(alvo, pedidoDeRegistro)).toEqual({ ok: true, valor: alvo })
  })

  it('recusa drive_id que não é o do arquivo (o hash de outro arquivo da pasta não pode ser gravado nele)', () => {
    const recusa = conferirAlvoDoRegistro(alvo, { ...pedidoDeRegistro, driveId: 'drive-de-outro' })
    expect(codigo(recusa)).toBe('entrada_invalida')
    expect(mensagem(recusa)).toContain('drive_id')
  })

  it('recusa arquivo que não existe, de outro processo ou de versão histórica', () => {
    expect(codigo(conferirAlvoDoRegistro(null, pedidoDeRegistro))).toBe('entrada_invalida')
    const outro = { ...pedidoDeRegistro, processoId: '9f000000-0000-0000-0000-0000000000b2' }
    expect(codigo(conferirAlvoDoRegistro(alvo, outro))).toBe('entrada_invalida')
    expect(codigo(conferirAlvoDoRegistro({ ...alvo, historica: true }, pedidoDeRegistro))).toBe('versao_historica_somente_leitura')
  })

  it('recusa arquivo de versão aprovada', () => {
    expect(codigo(conferirAlvoDoRegistro({ ...alvo, aprovada: true }, pedidoDeRegistro))).toBe('versao_aprovada')
  })
})

describe('conferirVersaoDoProcesso', () => {
  it('aceita a versão que é do processo do pedido', () => {
    expect(conferirVersaoDoProcesso(PROCESSO, PROCESSO)).toEqual({ ok: true, valor: PROCESSO })
  })

  it('recusa versão de outro processo ou que não existe, com a mesma recusa, sem revelar qual dos dois', () => {
    const outro = conferirVersaoDoProcesso('9f000000-0000-0000-0000-0000000000b2', PROCESSO)
    expect(codigo(outro)).toBe('entrada_invalida')
    expect(mensagem(outro)).toContain('versão não encontrada neste processo')
    expect(codigo(conferirVersaoDoProcesso(null, PROCESSO))).toBe('entrada_invalida')
  })
})
