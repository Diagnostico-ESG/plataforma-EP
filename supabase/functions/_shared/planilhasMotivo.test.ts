import { describe, expect, it } from 'vitest'
import { ErroDoGoogle, motivoDaFalha } from './planilhasMotivo.ts'
import { FalhaDoToken } from './tokenGoogle.ts'
import { senhaConfere } from './planilhasSenha.ts'

describe('motivoDaFalha', () => {
  it.each([400, 401, 403, 404])('o Google recusar a planilha interna (%i) dá planilha_interna_recusada', (status) => {
    expect(motivoDaFalha(new ErroDoGoogle('interna', status))).toBe('planilha_interna_recusada')
  })

  it.each([400, 401, 403, 404])('o Google recusar a planilha pública (%i) dá planilha_publica_recusada', (status) => {
    expect(motivoDaFalha(new ErroDoGoogle('publica', status))).toBe('planilha_publica_recusada')
  })

  it.each([429, 500, 502, 503])('o Google com limite ou fora do ar (%i) dá google_indisponivel', (status) => {
    expect(motivoDaFalha(new ErroDoGoogle('publica', status))).toBe('google_indisponivel')
  })

  it('falha de rede, sem status, dá google_indisponivel', () => {
    expect(motivoDaFalha(new ErroDoGoogle('interna', null))).toBe('google_indisponivel')
  })

  it('falha ao pegar o token dá google_indisponivel', () => {
    expect(motivoDaFalha(new FalhaDoToken(401))).toBe('google_indisponivel')
    expect(motivoDaFalha(new ErroDoGoogle('token', 400))).toBe('google_indisponivel')
  })

  it('qualquer outro erro dá erro_interno, sem repetir a mensagem dele', () => {
    expect(motivoDaFalha(new Error('mensagem com Nome Secreto'))).toBe('erro_interno')
    expect(motivoDaFalha('texto solto')).toBe('erro_interno')
    expect(motivoDaFalha(null)).toBe('erro_interno')
  })

  it('o código cabe nos 60 caracteres que o banco guarda', () => {
    const codigos = [
      motivoDaFalha(new ErroDoGoogle('interna', 403)),
      motivoDaFalha(new ErroDoGoogle('publica', 403)),
      motivoDaFalha(new ErroDoGoogle('interna', 500)),
      motivoDaFalha(new Error('x')),
    ]
    for (const codigo of codigos) expect(codigo.length).toBeLessThanOrEqual(60)
  })
})

describe('ErroDoGoogle', () => {
  it('a mensagem diz onde e o status, sem corpo de resposta nem identificador', () => {
    const erro = new ErroDoGoogle('publica', 403)
    expect(erro.message).toContain('publica')
    expect(erro.message).toContain('403')
    expect(erro.status).toBe(403)
    expect(erro.onde).toBe('publica')
  })
})

describe('senhaConfere', () => {
  it('aceita a senha certa', () => {
    expect(senhaConfere('senha-interna-inventada', 'senha-interna-inventada')).toBe(true)
  })

  it.each([
    ['errada', 'senha-interna-errada!!!!'],
    ['de tamanho diferente', 'curta'],
    ['com um caractere a mais', 'senha-interna-inventadaX'],
    ['vazia', ''],
    ['ausente', null],
    ['indefinida', undefined],
  ])('recusa a senha %s', (_nome, recebida) => {
    expect(senhaConfere(recebida, 'senha-interna-inventada')).toBe(false)
  })

  it('recusa tudo se a senha esperada não está configurada', () => {
    expect(senhaConfere('', '')).toBe(false)
    expect(senhaConfere('qualquer', '')).toBe(false)
  })
})
