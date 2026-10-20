import { describe, expect, it } from 'vitest'
import { pacoteMinimo } from './planilhasExemplos.ts'
import { validarPacote } from './planilhasPacote.ts'

// O pacote de fora é dado sem tipo: o teste o estraga por campo, sem depender dos tipos da montagem.
type Pacote = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function copia(): Pacote {
  return structuredClone(pacoteMinimo()) as unknown as Pacote
}

function recusa(mudar: (pacote: Pacote) => void): string {
  const pacote = copia()
  mudar(pacote)
  const resultado = validarPacote(pacote)
  if (resultado.ok) throw new Error('o pacote devia ser recusado')
  expect(resultado.recusa.codigo).toBe('entrada_invalida')
  return resultado.recusa.mensagem
}

describe('validarPacote', () => {
  it('aceita um pacote válido', () => {
    expect(validarPacote(pacoteMinimo()).ok).toBe(true)
  })

  it.each([['um texto', 'texto'], ['nulo', null], ['uma lista', []]])(
    'recusa corpo que é %s, dizendo o tipo recebido',
    (_nome, corpo) => {
      const resultado = validarPacote(corpo)
      expect(resultado.ok).toBe(false)
      if (!resultado.ok) expect(resultado.recusa.mensagem).toContain('corpo: esperado objeto')
    },
  )

  it('recusa tentativa fora do formato uuid', () => {
    expect(recusa((p) => { p.tentativa = 'nao-e-uuid' })).toContain('campo tentativa: esperado uuid')
  })

  it('recusa ficha fora de 64 caracteres hexadecimais', () => {
    expect(recusa((p) => { p.ficha = 'abc' })).toContain('campo ficha: esperado 64 caracteres hexadecimais')
  })

  it('recusa a data e hora da geração que não é data', () => {
    expect(recusa((p) => { p.gerado_em = 'ontem' })).toContain('campo gerado_em: esperado data e hora ISO')
  })

  it('recusa identificador de planilha ausente ou fora do formato, sem repetir o valor', () => {
    const faltando = recusa((p) => { delete p.planilhas.interna })
    expect(faltando).toContain('campo planilhas.interna: esperado identificador de planilha do Google, recebido undefined')
    const ruim = recusa((p) => { p.planilhas.publica = 'com espaco e /' })
    expect(ruim).toContain('campo planilhas.publica')
    expect(ruim).not.toContain('com espaco')
  })

  it('recusa etapas que não é lista', () => {
    expect(recusa((p) => { p.etapas = 'x' })).toContain('campo etapas: esperado lista, recebido string')
  })

  it('recusa a fase fora de IV a IX, citando o valor recebido', () => {
    expect(recusa((p) => { p.etapas[0].fase = 'III' })).toContain(
      'campo etapas[0].fase: esperado IV, V, VI, VII, VIII ou IX, recebido "III"',
    )
  })

  it('aceita a fase VIII e IX', () => {
    const pacote = copia()
    pacote.etapas[0].fase = 'IX'
    expect(validarPacote(pacote).ok).toBe(true)
  })

  it('recusa tipo, situação guardada e status fora da lista, citando o valor', () => {
    const tipo = recusa((p) => { p.processos[0].tipo = 'outro' })
    expect(tipo).toContain('campo processos[0].tipo')
    expect(tipo).toContain('recebido "outro"')
    expect(recusa((p) => { p.processos[0].situacao_guardada = 'apagado' })).toContain('recebido "apagado"')
    expect(recusa((p) => { p.andamentos[0].status = 'feito' })).toContain('campo andamentos[0].status')
  })

  it('recusa concluido que não é booleano', () => {
    expect(recusa((p) => { p.processos[0].concluido = 'sim' })).toContain(
      'campo processos[0].concluido: esperado booleano, recebido string',
    )
  })

  it('recusa última versão que não é inteiro positivo nem nulo', () => {
    expect(recusa((p) => { p.processos[0].ultima_versao = 0 })).toContain('campo processos[0].ultima_versao')
    expect(recusa((p) => { p.processos[0].ultima_versao = '7' })).toContain('recebido string')
  })

  it('aceita a última versão como inteiro', () => {
    const pacote = copia()
    pacote.processos[0].ultima_versao = 7
    expect(validarPacote(pacote).ok).toBe(true)
  })

  it('recusa data da reunião fora do formato AAAA-MM-DD', () => {
    expect(recusa((p) => { p.processos[0].data_da_reuniao = '10/03/2026' })).toContain(
      'campo processos[0].data_da_reuniao: esperado AAAA-MM-DD ou nulo',
    )
  })

  it('recusa data de andamento fora do formato AAAA-MM-DD', () => {
    expect(recusa((p) => { p.andamentos[0].resolvida_em = '2026-10-20T10:00:00Z' })).toContain(
      'campo andamentos[0].resolvida_em',
    )
  })

  it('recusa nome de processo vazio, dizendo só o tipo recebido', () => {
    expect(recusa((p) => { p.processos[0].nome = '   ' })).toContain(
      'campo processos[0].nome: esperado texto não vazio, recebido string',
    )
  })

  it('recusa observações que não são texto nem nulo', () => {
    expect(recusa((p) => { p.processos[0].observacoes = 12345 })).toContain(
      'campo processos[0].observacoes: esperado texto ou nulo, recebido number',
    )
  })

  it('não repete nome de processo nem observação em nenhuma mensagem', () => {
    const mensagem = recusa((p) => {
      p.processos[0].nome = 'Nome Secreto Inventado'
      p.processos[0].observacoes = 'Observação Secreta Inventada'
      p.processos[0].tipo = 'outro'
    })
    expect(mensagem).not.toContain('Secreto')
  })
})
