import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { ReunioesFalso, type SetorDoFalso } from '../reunioes/ReunioesFalso'
import type { ProcessoDaReuniao, Reuniao } from '../reunioes/tipos'

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

export function reuniao(id: string, data: string, mudancas: Partial<Reuniao> = {}): Reuniao {
  return {
    id, tipo: 'sensibilizacao', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data, hora: null, local: null,
    anotacoes: null, processos: [], ...mudancas,
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

/** Renderiza o aplicativo inteiro com a falsa de reuniões, já com setores e processos inventados. */
export function montarReunioes({ perfil = 'integrante_ep', reunioes = REUNIOES_DE_TESTE, ajustar }: Montagem = {}) {
  const falso = new ReunioesFalso()
  falso.reunioes = reunioes
  falso.setores = SETORES_DE_TESTE
  falso.processosDosSetores = PROCESSOS_DE_TESTE
  ajustar?.(falso)
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={falso} />)
  return falso
}

/** O texto de cada linha da tabela de reuniões: o cabeçalho, os títulos de grupo e as reuniões. */
export async function linhasDasReunioes(): Promise<string[][]> {
  await screen.findAllByRole('cell')
  const tabela = screen.getByRole('table')
  return within(tabela).getAllByRole('row').map((linha) =>
    within(linha).queryAllByRole(linha.querySelector('td') ? 'cell' : 'columnheader').map((celula) => celula.textContent ?? ''))
}
