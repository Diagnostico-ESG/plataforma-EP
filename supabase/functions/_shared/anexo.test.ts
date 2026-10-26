import { describe, expect, it } from 'vitest'
import { LIMITE_DE_TAMANHO } from './decisao.ts'
import { LIMITE_DO_NOME, nomeDoAnexoNoDrive, validarEnvio, validarIniciarEnvioDoAnexo } from './anexo.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'

function envio(mudancas: Record<string, unknown> = {}): Record<string, unknown> {
  return { acao: 'iniciar_envio', processo_id: PROCESSO, papel: 'anexo', nome_original: 'resposta.eml', tamanho: 1024, ...mudancas }
}

function recusaDe(corpo: unknown) {
  const resultado = validarIniciarEnvioDoAnexo(corpo)
  return resultado.ok ? null : resultado.recusa
}

describe('validarIniciarEnvioDoAnexo', () => {
  it('aceita o pedido mínimo, sem número, histórica nem piloto', () => {
    const resultado = validarIniciarEnvioDoAnexo(envio())
    expect(resultado).toEqual({ ok: true, valor: { processoId: PROCESSO, nomeOriginal: 'resposta.eml', tamanho: 1024 } })
  })

  it('ignora o que o anexo não usa, mesmo se a tela mandar', () => {
    const resultado = validarIniciarEnvioDoAnexo(envio({ numero: 3, historica: true, piloto: true, numero_do_relatorio: 2 }))
    expect(resultado.ok).toBe(true)
  })

  it.each(['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'eml'])('aceita .%s, também em maiúsculas', (extensao) => {
    expect(recusaDe(envio({ nome_original: `arquivo.${extensao}` }))).toBeNull()
    expect(recusaDe(envio({ nome_original: `ARQUIVO.${extensao.toUpperCase()}` }))).toBeNull()
  })

  it('recusa extensão fora da lista, dizendo só a extensão recebida (o nome pode ter nome de pessoa)', () => {
    const recusa = recusaDe(envio({ nome_original: 'carta-da-maria-silva.exe' }))
    expect(recusa?.codigo).toBe('extensao_nao_aceita')
    expect(recusa?.mensagem).toContain('.exe')
    expect(recusa?.mensagem).not.toContain('maria')
  })

  it('recusa nome sem extensão', () => {
    expect(recusaDe(envio({ nome_original: 'LEIAME' }))?.codigo).toBe('extensao_nao_aceita')
  })

  it('aceita 20 MB e recusa 20 MB + 1 byte', () => {
    expect(recusaDe(envio({ tamanho: LIMITE_DE_TAMANHO }))).toBeNull()
    expect(recusaDe(envio({ tamanho: LIMITE_DE_TAMANHO + 1 }))?.codigo).toBe('arquivo_grande')
  })

  it.each([0, -1, 1.5, '10', null])('recusa tamanho %j', (tamanho) => {
    expect(recusaDe(envio({ tamanho }))?.codigo).toBe('entrada_invalida')
  })

  it('aceita o nome de 300 caracteres e recusa o de 301, sem repetir o nome na mensagem', () => {
    const base = 'a'.repeat(LIMITE_DO_NOME - 4)
    expect(recusaDe(envio({ nome_original: `${base}.pdf` }))).toBeNull()
    const recusa = recusaDe(envio({ nome_original: `${base}b.pdf` }))
    expect(recusa?.codigo).toBe('entrada_invalida')
    expect(recusa?.mensagem).toContain('300')
    expect(recusa?.mensagem).not.toContain(base)
  })

  it.each(['', '   ', 42, null])('recusa nome %j', (nome) => {
    expect(recusaDe(envio({ nome_original: nome }))?.codigo).toBe('entrada_invalida')
  })

  it('recusa processo que não é uuid e corpo que não é objeto', () => {
    expect(recusaDe(envio({ processo_id: 'x' }))?.codigo).toBe('entrada_invalida')
    expect(recusaDe(null)?.codigo).toBe('entrada_invalida')
    expect(recusaDe('texto')?.codigo).toBe('entrada_invalida')
  })
})

describe('nomeDoAnexoNoDrive', () => {
  it('mantém o nome original e a extensão', () => {
    expect(nomeDoAnexoNoDrive('Resposta do setor.eml')).toBe('Resposta do setor.eml')
  })

  it('troca os caracteres que o Drive não aceita e junta os espaços', () => {
    expect(nomeDoAnexoNoDrive('  a:b*c?  d.pdf ')).toBe('a-b-c- d.pdf')
  })

  it('devolve o mesmo nome para dois anexos de nome igual (o Drive aceita nomes repetidos)', () => {
    expect(nomeDoAnexoNoDrive('resposta.eml')).toBe(nomeDoAnexoNoDrive('resposta.eml'))
  })
})

describe('validarEnvio', () => {
  it('manda o papel anexo para a regra do anexo, que não pede número', () => {
    expect(validarEnvio(envio())).toMatchObject({ ok: true, valor: { tipo: 'anexo', entrada: { nomeOriginal: 'resposta.eml' } } })
  })

  it('deixa os outros papéis na regra de sempre, que pede o número', () => {
    const geral = { acao: 'iniciar_envio', processo_id: PROCESSO, papel: 'bpm', nome_original: 'fluxo.bpm', tamanho: 10 }
    expect(validarEnvio(geral).ok).toBe(false)
    expect(validarEnvio({ ...geral, numero: 2, historica: false })).toMatchObject({ ok: true, valor: { tipo: 'arquivo' } })
  })

  it('recusa corpo que não é objeto', () => {
    const resultado = validarEnvio(null)
    expect(resultado.ok).toBe(false)
  })
})
