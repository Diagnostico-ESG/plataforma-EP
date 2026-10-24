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
    expect(recusa((p) => { p.etapas[1].fase = 'III' })).toContain(
      'campo etapas[1].fase: esperado IV, V, VI, VII, VIII ou IX, recebido "III"',
    )
  })

  it('aceita a fase VIII e IX', () => {
    const pacote = copia()
    pacote.etapas[1].fase = 'IX'
    expect(validarPacote(pacote).ok).toBe(true)
  })

  it('aceita a fase vazia nas duas fixas', () => {
    const fixas = copia().etapas.filter((etapa: Pacote) => etapa.fase === null).map((etapa: Pacote) => etapa.codigo)
    expect(fixas).toEqual(['nao_iniciados', 'concluidos'])
    expect(validarPacote(pacoteMinimo()).ok).toBe(true)
  })

  it('recusa fase preenchida numa fixa, citando o valor recebido', () => {
    expect(recusa((p) => { p.etapas[0].fase = 'IV' })).toContain(
      'campo etapas[0].fase: esperado vazio nas etapas fixas, recebido "IV"',
    )
    expect(recusa((p) => { p.etapas[7].fase = 'VII' })).toContain('campo etapas[7].fase: esperado vazio nas etapas fixas')
  })

  it('recusa fase vazia numa etapa de trabalho', () => {
    expect(recusa((p) => { p.etapas[1].fase = null })).toContain(
      'campo etapas[1].fase: esperado IV, V, VI, VII, VIII ou IX, recebido null',
    )
  })

  it('recusa tipo, situação guardada e etiqueta fora da lista, citando o valor', () => {
    const tipo = recusa((p) => { p.processos[0].tipo = 'outro' })
    expect(tipo).toContain('campo processos[0].tipo')
    expect(tipo).toContain('recebido "outro"')
    expect(recusa((p) => { p.processos[0].situacao_guardada = 'apagado' })).toContain('recebido "apagado"')
    expect(recusa((p) => { p.passagens[0].etiqueta = 'feito' })).toContain('campo passagens[0].etiqueta')
  })

  it('recusa etapa atual que não é uuid e etiqueta do processo fora da lista', () => {
    expect(recusa((p) => { p.processos[0].etapa_atual_id = null })).toContain(
      'campo processos[0].etapa_atual_id: esperado uuid, recebido null',
    )
    expect(recusa((p) => { p.processos[0].etiqueta = 'parado' })).toContain('recebido "parado"')
  })

  it('aceita a data da publicação e recusa a que está fora do formato AAAA-MM-DD', () => {
    const pacote = copia()
    pacote.processos[0].publicado_em = '2026-07-01'
    expect(validarPacote(pacote).ok).toBe(true)
    expect(recusa((p) => { p.processos[0].publicado_em = '01/07/2026' })).toContain(
      'campo processos[0].publicado_em: esperado AAAA-MM-DD ou nulo',
    )
  })

  it('recusa processo sem passagem aberta, sem citar o nome', () => {
    const mensagem = recusa((p) => { p.passagens[0].saiu_em = '2026-03-02T12:00:00Z' })
    expect(mensagem).toContain('campo passagens: esperado uma passagem aberta por processo, recebido 0 em processos[0]')
    expect(mensagem).not.toContain('Processo 10')
  })

  it('recusa processo com duas passagens abertas', () => {
    expect(recusa((p) => { p.passagens.push({ ...p.passagens[0] }) })).toContain(
      'esperado uma passagem aberta por processo, recebido 2 em processos[0]',
    )
  })

  it('aceita data e hora de passagem com fuso e recusa a que não é data', () => {
    const pacote = copia()
    pacote.passagens[0].entrou_em = '2026-10-24T12:00:00.123456+00:00'
    expect(validarPacote(pacote).ok).toBe(true)
    expect(recusa((p) => { p.passagens[0].entrou_em = 'ontem' })).toContain(
      'campo passagens[0].entrou_em: esperado data e hora ISO',
    )
    expect(recusa((p) => { p.passagens[0].concluido_em = 'ontem' })).toContain('campo passagens[0].concluido_em')
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
