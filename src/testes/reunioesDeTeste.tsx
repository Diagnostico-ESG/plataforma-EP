import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { ReunioesFalso, type SetorDoFalso } from '../reunioes/ReunioesFalso'
import type { ProcessoDaReuniao, ResponsavelDaReuniao, Reuniao, UsuarioDaReuniao } from '../reunioes/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'

/** Hoje nos testes de reuniões: a tela calcula "próxima" e "realizada" pelo relógio. */
export const HOJE_DE_TESTE = new Date(2026, 9, 14, 12, 0)

/** Só o Date é simulado: os temporizadores seguem reais, e o waitFor continua funcionando. */
export function fixarOHoje() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(HOJE_DE_TESTE)
}

export const SETORES_DE_TESTE: SetorDoFalso[] = [
  { id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true },
  { id: 's2', sigla: 'TSB', nome: 'Setor B', ativo: true },
  { id: 's3', sigla: 'TSC', nome: 'Setor C', ativo: false },
]

export const PROCESSOS_DE_TESTE: Record<string, ProcessoDaReuniao[]> = {
  s1: [{ id: 'p1', nome: 'Emitir Ofício', cancelado: false }, { id: 'p2', nome: 'Arquivar Pasta', cancelado: true }],
  s2: [{ id: 'p3', nome: 'Pagar Diária', cancelado: false }],
  s3: [],
}

/** O cadastro de usuários do EP: Ana e Bia ativas, Caio inativo. */
export const USUARIOS_DE_TESTE: UsuarioDaReuniao[] = [
  { id: 'u1', nome: 'Ana Teste', ativo: true },
  { id: 'u2', nome: 'Bia Teste', ativo: true },
  { id: 'u3', nome: 'Caio Teste', ativo: false },
]

/** Os responsáveis de cada setor (pelo id do setor). */
export const RESPONSAVEIS_DE_TESTE: Record<string, ResponsavelDaReuniao[]> = {
  s1: [{ id: 'x1', nome: 'Dani Teste' }, { id: 'x2', nome: 'Edu Teste' }],
  s2: [{ id: 'x3', nome: 'Fabi Teste' }],
  s3: [],
}

export function reuniao(id: string, data: string, mudancas: Partial<Reuniao> = {}): Reuniao {
  return {
    id, tipo: 'sensibilizacao', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data, hora: null, local: null,
    anotacoes: null, outrosParticipantes: [], processos: [], usuarios: [], responsaveis: [], ...mudancas,
  }
}

/** Duas próximas, a de hoje e duas realizadas; duas delas sem anotações. */
export const REUNIOES_DE_TESTE: Reuniao[] = [
  reuniao('r1', '2026-10-20', { hora: '09:30', local: 'Sala 1', anotacoes: 'Pauta combinada' }),
  reuniao('r2', '2026-11-02', {
    tipo: 'modelagem', setorId: 's2', setorSigla: 'TSB', processos: [{ id: 'p3', nome: 'Pagar Diária', cancelado: false }],
  }),
  reuniao('r3', '2026-10-14'),
  reuniao('r4', '2026-10-01', {
    tipo: 'modelagem', local: 'Link da chamada', anotacoes: 'Ficou combinado revisar o fluxo.\nPrazo na sexta.',
    processos: [{ id: 'p2', nome: 'Arquivar Pasta', cancelado: true }, { id: 'p1', nome: 'Emitir Ofício', cancelado: false }],
  }),
  reuniao('r5', '2026-09-05', { setorId: 's2', setorSigla: 'TSB' }),
]

type Montagem = { perfil?: Perfil; reunioes?: Reuniao[]; ajustar?: (falso: ReunioesFalso) => void }

/** A falsa de reuniões com setores, processos, usuários e responsáveis inventados. */
export function falsoDeReunioes({ reunioes = REUNIOES_DE_TESTE, ajustar }: Omit<Montagem, 'perfil'> = {}): ReunioesFalso {
  const falso = new ReunioesFalso()
  falso.reunioes = reunioes
  falso.setores = SETORES_DE_TESTE
  falso.processosDosSetores = PROCESSOS_DE_TESTE
  falso.usuarios = USUARIOS_DE_TESTE
  falso.responsaveisDosSetores = RESPONSAVEIS_DE_TESTE
  ajustar?.(falso)
  return falso
}

/** Renderiza o aplicativo inteiro com a falsa de reuniões, já com setores e processos inventados. */
export function montarReunioes({ perfil = 'integrante_ep', ...montagem }: Montagem = {}) {
  const falso = falsoDeReunioes(montagem)
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={falso} versoes={new VersoesFalso()} />)
  return falso
}

/** O texto de cada linha da tabela de reuniões: o cabeçalho, os títulos de grupo e as reuniões. */
export async function linhasDasReunioes(): Promise<string[][]> {
  await screen.findAllByRole('cell')
  const tabela = screen.getByRole('table')
  return within(tabela).getAllByRole('row').map((linha) =>
    within(linha).queryAllByRole(linha.querySelector('td') ? 'cell' : 'columnheader').map((celula) => celula.textContent ?? ''))
}
