import { describe, expect, test } from 'vitest'
import { apenasOQueMudou, nomeDaReuniaoNoHistorico, valorDoCampoDaReuniao } from './textosDoHistorico'

describe('nomeDaReuniaoNoHistorico', () => {
  test('traz o tipo, a data e o setor', () => {
    expect(nomeDaReuniaoNoHistorico({ tipo: 'modelagem', data: '2026-10-14', setor_sigla: 'TSA' }))
      .toBe('Reunião de modelagem de 14/10/2026 — TSA')
  })

  test('o que falta no estado aparece como traço', () => {
    expect(nomeDaReuniaoNoHistorico({})).toBe('Reunião de — de — — —')
  })
})

describe('valorDoCampoDaReuniao', () => {
  test('a data sai em dia/mês/ano', () => {
    expect(valorDoCampoDaReuniao('data', '2026-10-14')).toBe('14/10/2026')
  })

  test('outros participantes: nomes separados por vírgula, ou "nenhum"', () => {
    expect(valorDoCampoDaReuniao('outros_participantes', ['Ana', 'Bia'])).toBe('Ana, Bia')
    expect(valorDoCampoDaReuniao('outros_participantes', [])).toBe('nenhum')
  })

  test('campo que não é só da reunião fica com quem o trata (null)', () => {
    expect(valorDoCampoDaReuniao('local', 'Sala 1')).toBeNull()
  })
})

describe('apenasOQueMudou', () => {
  test('devolve só os campos que diferem, no antes e no depois', () => {
    const antes = { local: 'Sala 1', data: '2026-10-14', processos: [{ id: 'p1', nome: 'A' }] }
    const depois = { local: 'Sala 2', data: '2026-10-14', processos: [{ id: 'p1', nome: 'A' }] }
    expect(apenasOQueMudou(antes, depois)).toEqual([{ local: 'Sala 1' }, { local: 'Sala 2' }])
  })

  test('lista que muda conta como mudança', () => {
    const [antes, depois] = apenasOQueMudou({ processos: [{ id: 'p1', nome: 'A' }] }, { processos: [{ id: 'p2', nome: 'B' }] })
    expect(Object.keys(antes ?? {})).toEqual(['processos'])
    expect(Object.keys(depois ?? {})).toEqual(['processos'])
  })

  test('campo que só existe de um lado aparece nos dois, com traço no que falta', () => {
    expect(apenasOQueMudou({ local: 'Sala 1' }, {})).toEqual([{ local: 'Sala 1' }, { local: undefined }])
  })

  test('antes ou depois ausente (criação, exclusão) fica como está', () => {
    expect(apenasOQueMudou(null, { local: 'Sala 1' })).toEqual([null, { local: 'Sala 1' }])
    expect(apenasOQueMudou({ local: 'Sala 1' }, null)).toEqual([{ local: 'Sala 1' }, null])
  })

  test('nada mudou: dois vazios', () => {
    expect(apenasOQueMudou({ local: 'A' }, { local: 'A' })).toEqual([{}, {}])
  })
})
