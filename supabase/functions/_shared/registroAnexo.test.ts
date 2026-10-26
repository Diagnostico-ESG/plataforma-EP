import { describe, expect, it } from 'vitest'
import { validarRegistro, validarRegistrarAnexo } from './registroAnexo.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'

function registro(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return { acao: 'registrar', processo_id: PROCESSO, arquivos: [{ papel: 'anexo', drive_id: 'drive-anexo-1' }], ...mudancas }
}

function recusaDe(corpo: unknown) {
  const resultado = validarRegistrarAnexo(corpo)
  return resultado.ok ? null : resultado.recusa
}

describe('validarRegistrarAnexo', () => {
  it('aceita um arquivo só, sem número, versão nem histórica', () => {
    expect(validarRegistrarAnexo(registro())).toEqual({ ok: true, valor: { processoId: PROCESSO, driveId: 'drive-anexo-1' } })
  })

  it('ignora o número e os campos de versão quando vêm vazios ou falsos', () => {
    const corpo = registro({ numero: 3, historica: false, piloto: false, versao_id: null, arquivo_id: null, numero_do_relatorio: null })
    expect(recusaDe(corpo)).toBeNull()
  })

  it.each([
    ['versao_id', '9f000000-0000-0000-0000-0000000000c1'],
    ['arquivo_id', '9f000000-0000-0000-0000-0000000000c1'],
    ['historica', true],
    ['piloto', true],
    ['numero_do_relatorio', 2],
  ])('recusa o campo %s, que não é do anexo', (campo, valor) => {
    expect(recusaDe(registro({ [campo]: valor }))?.codigo).toBe('entrada_invalida')
  })

  it('recusa mais de um arquivo, lista vazia e outro papel misturado', () => {
    const item = { papel: 'anexo', drive_id: 'drive-anexo-1' }
    expect(recusaDe(registro({ arquivos: [item, { ...item, drive_id: 'drive-anexo-2' }] }))?.codigo).toBe('entrada_invalida')
    expect(recusaDe(registro({ arquivos: [] }))?.codigo).toBe('entrada_invalida')
    expect(recusaDe(registro({ arquivos: [item, { papel: 'png', drive_id: 'drive-png' }] }))?.codigo).toBe('entrada_invalida')
  })

  it.each(['../x', 'x?param=1', '', 'com espaço', 42, null])('recusa o identificador do Drive %j', (driveId) => {
    expect(recusaDe(registro({ arquivos: [{ papel: 'anexo', drive_id: driveId }] }))?.codigo).toBe('entrada_invalida')
  })

  it('recusa processo que não é uuid e corpo que não é objeto', () => {
    expect(recusaDe(registro({ processo_id: 'x' }))?.codigo).toBe('entrada_invalida')
    expect(recusaDe(null)?.codigo).toBe('entrada_invalida')
  })
})

describe('validarRegistro', () => {
  it('manda o pedido com o papel anexo para a regra do anexo', () => {
    expect(validarRegistro(registro())).toMatchObject({ ok: true, valor: { tipo: 'anexo', entrada: { driveId: 'drive-anexo-1' } } })
  })

  it('deixa os outros pedidos na regra das versões, que pede o número', () => {
    const versao = { acao: 'registrar', processo_id: PROCESSO, arquivos: [{ papel: 'bpm', drive_id: 'drive-bpm' }] }
    expect(validarRegistro(versao).ok).toBe(false)
    expect(validarRegistro({ ...versao, numero: 1 })).toMatchObject({ ok: true, valor: { tipo: 'versao' } })
  })

  it('recusa corpo que não é objeto', () => {
    expect(validarRegistro(null).ok).toBe(false)
  })
})
