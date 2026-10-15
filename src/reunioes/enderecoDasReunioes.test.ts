import { expect, test } from 'vitest'
import {
  SEM_FILTROS_DAS_REUNIOES, lerEnderecoDasReunioes, lerModeloDaReuniao, montarEnderecoDasReunioes, montarEnderecoDeNovaReuniao,
} from './enderecoDasReunioes'

test('o endereço sem nada é a lista sem filtros', () => {
  expect(lerEnderecoDasReunioes('#/reunioes')).toEqual({ aberto: null, filtros: SEM_FILTROS_DAS_REUNIOES })
})

test('lê a reunião aberta, "nova" e os filtros; monta de volta o mesmo endereço', () => {
  const endereco = '#/reunioes/r1?setor=s1&tipo=modelagem&de=2026-10-01&ate=2026-10-31'
  const lido = lerEnderecoDasReunioes(endereco)
  expect(lido).toEqual({
    aberto: 'r1', filtros: { setor: 's1', tipo: 'modelagem', de: '2026-10-01', ate: '2026-10-31' },
  })
  expect(montarEnderecoDasReunioes(lido)).toBe(endereco)
  expect(lerEnderecoDasReunioes('#/reunioes/nova').aberto).toBe('nova')
})

test('tipo desconhecido e data fora do formato AAAA-MM-DD são ignorados', () => {
  const { filtros } = lerEnderecoDasReunioes('#/reunioes?tipo=oficina&de=ontem&ate=2026-10-31')
  expect(filtros).toEqual({ setor: null, tipo: null, de: null, ate: '2026-10-31' })
})

test('sem filtro nem item aberto, o endereço é só a área', () => {
  expect(montarEnderecoDasReunioes({ aberto: null, filtros: SEM_FILTROS_DAS_REUNIOES })).toBe('#/reunioes')
})

test('o endereço do registro preenchido guarda setor, tipo e processo em campos próprios, sem colidir com os filtros', () => {
  const endereco = montarEnderecoDeNovaReuniao({ setorId: 's1', tipo: 'modelagem', processoId: 'p1' })
  expect(endereco).toBe('#/reunioes/nova?para-setor=s1&para-tipo=modelagem&para-processo=p1')
  expect(lerModeloDaReuniao(endereco)).toEqual({ setorId: 's1', tipo: 'modelagem', processoId: 'p1' })
  expect(lerEnderecoDasReunioes(endereco)).toEqual({ aberto: 'nova', filtros: SEM_FILTROS_DAS_REUNIOES })
})

test('o registro só com o setor tem tipo e processo nulos', () => {
  const endereco = montarEnderecoDeNovaReuniao({ setorId: 's1', tipo: null, processoId: null })
  expect(endereco).toBe('#/reunioes/nova?para-setor=s1')
  expect(lerModeloDaReuniao(endereco)).toEqual({ setorId: 's1', tipo: null, processoId: null })
})

test('sem setor não há modelo, e tipo desconhecido é ignorado', () => {
  expect(lerModeloDaReuniao('#/reunioes/nova')).toBeNull()
  expect(lerModeloDaReuniao('#/reunioes/nova?para-tipo=modelagem')).toBeNull()
  expect(lerModeloDaReuniao('#/reunioes/nova?para-setor=s1&para-tipo=oficina')?.tipo).toBeNull()
})
