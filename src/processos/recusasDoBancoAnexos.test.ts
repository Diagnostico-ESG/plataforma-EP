import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { RECUSAS_DOS_PROCESSOS } from './processosSupabase'
import { falhaDoBanco } from './recusasDoBanco'

// A recusa do banco ao excluir processo com anexo (migração anexos): o total vem no valor.
function recusa(valor: string) {
  return falhaDoBanco({ code: 'P0001', message: `processo_com_anexos:${valor}` }, RECUSAS_DOS_PROCESSOS)
}

describe('processo_com_anexos', () => {
  test('diz quantos anexos há e o caminho (cancelar), no singular e no plural', () => {
    expect(recusa('1')).toBeInstanceOf(TravaDoBanco)
    expect(recusa('1').message).toBe('Não é possível excluir: processo tem 1 anexo. Cancele o processo em vez de excluí-lo.')
    expect(recusa('3').message).toBe('Não é possível excluir: processo tem 3 anexos. Cancele o processo em vez de excluí-lo.')
  })
})
