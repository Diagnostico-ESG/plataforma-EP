import { expect, test } from 'vitest'
import { CATALOGO_DE_TESTE, umProcesso, umSetor } from '../testes/processoDaLista'
import { colunasDoQuadro } from './colunasDoQuadro'
import { chaveDaLinha, linhasDoQuadro } from './linhasDoQuadro'
import type { ProcessoDaLista, ResponsavelDoProcesso } from './tipos'

const ANA: ResponsavelDoProcesso = { id: 'u1', nome: 'Ana Lima', fotoUrl: null }
const BRUNO: ResponsavelDoProcesso = { id: 'u2', nome: 'Bruno Reis', fotoUrl: null }
const setores = [umSetor('s1', 'SGA', 'Secretaria'), umSetor('s2', 'CDI', 'Documentação'), umSetor('s3', 'OUV', 'Ouvidoria'), umSetor('s4', 'ANT', 'Antigo', false)]
const doSetor = (setorId: string, setorSigla: string, responsavel: ResponsavelDoProcesso | null = ANA, extra: Partial<ProcessoDaLista> = {}) =>
  umProcesso(`${setorSigla}-${responsavel?.nome ?? 'ninguem'}`, { setorId, setorSigla, responsavel, ...extra })
const linhas = (tipo: 'setor' | 'responsavel', processos: ProcessoDaLista[], usuarioId = 'ninguem') =>
  linhasDoQuadro(tipo, colunasDoQuadro({ etapas: CATALOGO_DE_TESTE, processos }), setores, usuarioId)

test('por setor: uma linha por setor com cartão, em ordem de sigla, sem as linhas vazias; o inativo com cartão aparece', () => {
  const resultado = linhas('setor', [doSetor('s1', 'SGA'), doSetor('s2', 'CDI'), doSetor('s4', 'ANT')])
  expect(resultado.map((linha) => linha.titulo)).toEqual(['ANT', 'CDI', 'SGA'])
  expect(resultado[0].inativo).toBe(true)
  expect(resultado[2]).toMatchObject({ chave: 's1', nome: 'Secretaria' })
})

test('por responsável: ordem alfabética, Sem responsável por último, Você para a própria pessoa e Inativo para o desativado', () => {
  const inativo = doSetor('s1', 'SGA', BRUNO, { cartao: { responsavelAtivo: false, ultimaVersao: null, subprocessos: 0 } })
  const resultado = linhas('responsavel', [doSetor('s1', 'SGA', null), inativo, doSetor('s2', 'CDI', ANA)], 'u1')
  expect(resultado.map((linha) => linha.titulo)).toEqual(['Ana Lima', 'Bruno Reis', 'Sem responsável'])
  expect(resultado.map((linha) => linha.voce === true)).toEqual([true, false, false])
  expect(resultado[1].inativo).toBe(true)
  expect(resultado[2].chave).toBe('sem-responsavel')
})

test('chaveDaLinha diz a linha do processo, a mesma das linhas', () => {
  expect(chaveDaLinha('setor', doSetor('s2', 'CDI'))).toBe('s2')
  expect(chaveDaLinha('responsavel', doSetor('s2', 'CDI', BRUNO))).toBe('u2')
  expect(chaveDaLinha('responsavel', doSetor('s2', 'CDI', null))).toBe('sem-responsavel')
})
