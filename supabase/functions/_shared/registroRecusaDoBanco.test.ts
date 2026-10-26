import { describe, expect, it } from 'vitest'
import { recusaDoBanco, statusDaRecusaDoBanco } from './registro.ts'

// Como a recusa do banco (P0001 "motivo:valor", 42501) chega à tela pela função arquivos-no-drive.
describe('recusaDoBanco', () => {
  it.each([
    ['historica_depois_de_versao_nova', 'historica_depois_de_versao_nova', ''],
    ['numero_historico_repetido:5', 'numero_historico_repetido', '5'],
    ['historica_sem_arquivo_de_fluxograma', 'historica_sem_arquivo_de_fluxograma', ''],
    ['numero_do_relatorio_mudou:4', 'numero_do_relatorio_mudou', '4'],
    ['relatorio_so_docx', 'relatorio_so_docx', ''],
    ['relatorio_sem_versao', 'relatorio_sem_versao', ''],
    ['relatorio_fora_da_etapa', 'relatorio_fora_da_etapa', ''],
    ['relatorio_fora_da_versao_mais_recente', 'relatorio_fora_da_versao_mais_recente', ''],
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
