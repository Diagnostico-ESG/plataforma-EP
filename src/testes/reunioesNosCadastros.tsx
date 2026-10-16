import { render } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ProcessoLido } from '../processos/tipos'
import type { ReunioesFalso } from '../reunioes/ReunioesFalso'
import { falsoDeReunioes, SETORES_DE_TESTE } from './reunioesDeTeste'
import { VersoesFalso } from '../versoes/VersoesFalso'

function processo(id: string, nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro Um',
    situacao: 'em_andamento', etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 },
    aguardandoOSetor: false, processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo',
    contexto: null, observacoes: null, motivoDaSituacao: null, etapasDoSetor: [], etapasDoProcesso: [], ...mudancas,
  }
}

/** Os mesmos processos das reuniões de teste (p1, p2 e p3), mais o p4, que nenhuma reunião tratou. */
export const PROCESSOS_DOS_CADASTROS: ProcessoLido[] = [
  processo('p1', 'Emitir Ofício'),
  processo('p2', 'Arquivar Pasta', { situacao: 'cancelado', etapaAtual: null }),
  processo('p3', 'Pagar Diária', { setorId: 's2', setorSigla: 'TSB' }),
  processo('p4', 'Conferir Recibo'),
]

type Montagem = {
  perfil?: Perfil
  ajustarReunioes?: (falso: ReunioesFalso) => void
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

/** O aplicativo inteiro com setores, processos e reuniões que combinam entre si (as reuniões de teste de sempre). */
export function montarNosCadastros(
  { perfil = 'integrante_ep', ajustarReunioes, ajustarProcessos, ajustarCadastros, ajustarVersoes }: Montagem = {},
) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = SETORES_DE_TESTE.map(({ id, sigla, nome, ativo }) => ({ id, sigla, nome, observacoes: null, ativo }))
  ajustarCadastros?.(cadastros)
  const processos = new ProcessosFalso()
  processos.processos = PROCESSOS_DOS_CADASTROS
  ajustarProcessos?.(processos)
  const reunioes = falsoDeReunioes({ ajustar: ajustarReunioes })
  const versoes = falsoDeVersoes(processos)
  ajustarVersoes?.(versoes)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={processos}
    reunioes={reunioes} versoes={versoes} />)
  return { cadastros, processos, reunioes, versoes }
}
