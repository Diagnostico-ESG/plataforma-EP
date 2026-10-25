import { render } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ProcessoLido } from '../processos/tipos'
import { CATALOGO_DE_TESTE, umProcessoLido } from './processoDaLista'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'
import { VersoesFalso } from '../versoes/VersoesFalso'

const SETORES_DE_TESTE = [
  { id: 's1', sigla: 'TSA', nome: 'Setor A', ativo: true },
  { id: 's2', sigla: 'TSB', nome: 'Setor B', ativo: true },
  { id: 's3', sigla: 'TSC', nome: 'Setor C', ativo: false },
]

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return umProcessoLido(nome, { id, macroprocessoNome: 'Macro Um', responsavel: null, ...mudancas }, 'modelagem')
}

/** Processos em dois setores (s1 e s2), um deles cancelado. */
export const PROCESSOS_DOS_CADASTROS: ProcessoLido[] = [
  processo('p1', 'Emitir Ofício'),
  processo('p2', 'Arquivar Pasta', { situacao: 'cancelado' }),
  processo('p3', 'Pagar Diária', { setorId: 's2', setorSigla: 'TSB' }),
  processo('p4', 'Conferir Recibo'),
]

type Montagem = {
  perfil?: Perfil
  ajustarProcessos?: (falso: ProcessosFalso) => void
  ajustarCadastros?: (falso: CadastrosFalso) => void
  ajustarVersoes?: (falso: VersoesFalso) => void
}

// O falso de versões conhece a sigla, o nome e a etapa atual de cada processo (para os nomes padrão e a etapa da
// versão), e o evento de cada envio vai para o histórico do processo, como o gatilho do banco faz.
function falsoDeVersoes(processos: ProcessosFalso): VersoesFalso {
  const versoes = new VersoesFalso()
  for (const processo of processos.processos) {
    versoes.processos[processo.id] = { sigla: processo.setorSigla, nome: processo.nome, etapa: processo.etapaAtual?.nome ?? null }
  }
  versoes.aoRegistrar = (processoId, evento) => {
    processos.historicoDosProcessos[processoId] = [evento, ...(processos.historicoDosProcessos[processoId] ?? [])]
  }
  return versoes
}

/** O aplicativo inteiro com setores e processos que combinam entre si. */
export function montarNosCadastros(
  { perfil = 'integrante_ep', ajustarProcessos, ajustarCadastros, ajustarVersoes }: Montagem = {},
) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = SETORES_DE_TESTE.map(({ id, sigla, nome, ativo }) => ({ id, sigla, nome, observacoes: null, ativo }))
  ajustarCadastros?.(cadastros)
  const processos = new ProcessosFalso()
  processos.processos = PROCESSOS_DOS_CADASTROS
  processos.etapasDoCatalogo = CATALOGO_DE_TESTE
  ajustarProcessos?.(processos)
  const versoes = falsoDeVersoes(processos)
  ajustarVersoes?.(versoes)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={processos}
    versoes={versoes} revisoes={new RevisoesFalso(processos)} planilhas={new PlanilhasFalso()} />)
  return { cadastros, processos, versoes }
}
