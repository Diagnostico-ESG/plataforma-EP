import { expect, test } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { falhaDaReuniao } from './recusasDeReunioes'

const TEXTOS = { local: 'Sala 1', anotacoes: 'x'.repeat(10001) }

function frase(mensagem: string, code?: string): string {
  const falha = falhaDaReuniao({ message: mensagem, code }, TEXTOS)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  return falha.message
}

test('cada recusa por regra vira a frase da tela, com o valor que o banco devolveu', () => {
  expect(frase('setor_inativo:TSC', 'P0001')).toBe('O setor TSC está inativo; escolha um setor ativo.')
  expect(frase('processo_de_outro_setor:Emitir Ofício', 'P0001')).toBe('O processo Emitir Ofício não é do setor da reunião.')
  expect(frase('modelagem_sem_processo', 'P0001')).toBe('A reunião de modelagem precisa de ao menos um processo.')
  expect(frase('sensibilizacao_com_processo', 'P0001')).toBe('A reunião de sensibilização não tem processos.')
})

test('texto longo demais cita o tamanho do que foi enviado', () => {
  expect(frase('violates check constraint "reunioes_anotacoes_tamanho"', '23514'))
    .toBe('As anotações podem ter no máximo 10.000 caracteres. Recebido: 10001.')
  expect(frase('violates check constraint "reunioes_local_tamanho"', '23514'))
    .toBe('O local pode ter no máximo 300 caracteres. Recebido: 6.')
})

test('falta de permissão, item que sumiu e erro desconhecido', () => {
  expect(frase('new row violates row-level security policy', '42501')).toBe('Seu perfil não permite alterar as reuniões.')
  expect(falhaDaReuniao({ message: 'registro_inexistente', code: 'P0001' }, TEXTOS)).toBeInstanceOf(CadastroInexistente)
  expect(falhaDaReuniao({ message: 'violates foreign key', code: '23503' }, TEXTOS)).toBeInstanceOf(CadastroInexistente)
  const outra = falhaDaReuniao({ message: 'algo estranho' }, TEXTOS)
  expect(outra).not.toBeInstanceOf(TravaDoBanco)
  expect(outra.message).toBe('erro inesperado do banco (algo estranho)')
})
