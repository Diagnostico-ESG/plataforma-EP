import { describe, expect, it } from 'vitest'
import { situacaoDoArquivo, validarConferir } from './conferencia.ts'
import { conferirChamador, lerAcao } from './decisao.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'
const GUARDADO = 'a'.repeat(32)
const OUTRO = 'b'.repeat(32)

describe('validarConferir', () => {
  it('lê o processo', () => {
    expect(validarConferir({ acao: 'conferir', processo_id: PROCESSO })).toEqual({ ok: true, valor: { processoId: PROCESSO } })
  })

  it.each([
    ['corpo que não é objeto', null],
    ['sem processo', { acao: 'conferir' }],
    ['processo que não é uuid', { processo_id: 'p1' }],
    ['processo de tipo errado', { processo_id: 5 }],
  ])('recusa %s', (_nome, corpo) => {
    const resultado = validarConferir(corpo)
    expect(!resultado.ok && resultado.recusa.codigo).toBe('entrada_invalida')
  })

  it('a mensagem traz o campo e o tipo recebido, nunca o valor', () => {
    const resultado = validarConferir({ processo_id: 'segredo' })
    expect(!resultado.ok && resultado.recusa.mensagem).toContain('processo_id')
    expect(!resultado.ok && resultado.recusa.mensagem).not.toContain('segredo')
  })
})

describe('situacaoDoArquivo', () => {
  it('ok quando o MD5 do Drive é o guardado', () => {
    expect(situacaoDoArquivo(GUARDADO, { md5Checksum: GUARDADO })).toBe('ok')
  })

  it('alterado quando o MD5 do Drive é outro', () => {
    expect(situacaoDoArquivo(GUARDADO, { md5Checksum: OUTRO })).toBe('alterado')
  })

  it('alterado quando o Drive não informa MD5 (o arquivo deixou de ser o binário enviado)', () => {
    expect(situacaoDoArquivo(GUARDADO, {})).toBe('alterado')
  })

  it('nao_encontrado quando o Drive não acha o arquivo', () => {
    expect(situacaoDoArquivo(GUARDADO, null)).toBe('nao_encontrado')
  })

  it('nao_encontrado quando o arquivo está na lixeira, mesmo com o MD5 igual', () => {
    expect(situacaoDoArquivo(GUARDADO, { md5Checksum: GUARDADO, trashed: true })).toBe('nao_encontrado')
  })
})

describe('quem pode conferir', () => {
  it('a ação é reconhecida', () => {
    expect(lerAcao({ acao: 'conferir' })).toBe('conferir')
  })

  it.each(['administrador', 'integrante_ep', 'consulta'] as const)('o perfil %s ativo pode', (perfil) => {
    expect(conferirChamador({ perfil, ativo: true }, 'conferir')).toBeNull()
  })

  it('recusa o usuário desativado e o visitante', () => {
    expect(conferirChamador({ perfil: 'administrador', ativo: false }, 'conferir')?.codigo).toBe('usuario_inativo')
    expect(conferirChamador(null, 'conferir')?.codigo).toBe('sem_login')
  })
})
