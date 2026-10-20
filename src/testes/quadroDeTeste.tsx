import { render, screen } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { hojeLocal } from '../processos/textoDaReuniao'
import type {
  DadosDoCartao, EtapaDoCatalogo, EtapaDoProcesso, ProcessoLido, StatusDaEtapa, UsuarioResponsavel,
} from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { PlanilhasFalso } from '../planilhas/PlanilhasFalso'

export const ETAPAS: EtapaDoCatalogo[] = [
  { id: 'e1', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 1, ativa: true },
  { id: 'e2', codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', ordem: 2, ativa: true },
  { id: 'e3', codigo: 'revisao_interna', nome: 'Revisão interna', ordem: 3, ativa: true },
  { id: 'e4', codigo: 'revisao_do_setor', nome: 'Revisão do setor', ordem: 4, ativa: true },
  { id: 'e5', codigo: 'aprovacao', nome: 'Aprovação', ordem: 5, ativa: true },
  { id: 'e6', codigo: 'eprotocolo', nome: 'E-protocolo', ordem: 6, ativa: true },
]

/** O dia de hoje deslocado em dias (AAAA-MM-DD), para os testes não dependerem da data em que rodam. */
export function dia(deslocamento: number): string {
  const data = new Date()
  data.setDate(data.getDate() + deslocamento)
  return hojeLocal(data)
}

export type Mudancas = {
  /** A posição (1 a 6) da etapa atual; as anteriores ficam concluídas e as seguintes pendentes. */
  posicao?: number
  anteriores?: StatusDaEtapa
  cartao?: Partial<DadosDoCartao>
  processo?: Partial<ProcessoLido>
}

let contador = 0

// As etapas lidas do processo seguem o caminho do cartão: o que o Quadro mostra e o que a janela de avanço lê não se contradizem.
function etapasDoProcesso(lido: ProcessoLido): EtapaDoProcesso[] {
  return ETAPAS.map((etapa, indice) => {
    const status = lido.cartao?.caminho[indice]?.status ?? 'pendente'
    const dela = lido.etapaAtual?.codigo === etapa.codigo ? lido.responsavel : null
    return {
      id: `${lido.id}-a${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, obrigatoria: true, status,
      nota: null, ...datasDoStatus(status), responsavelId: dela?.id ?? null, responsavelNome: dela?.nome ?? null,
      responsavelInativo: false,
    }
  })
}

function datasDoStatus(status: StatusDaEtapa): { iniciadaEm: string | null; resolvidaEm: string | null } {
  if (status === 'pendente') return { iniciadaEm: null, resolvidaEm: null }
  return { iniciadaEm: '2026-10-01', resolvidaEm: status === 'em_andamento' ? null : '2026-10-05' }
}

export function processo(nome: string, { posicao = 3, anteriores = 'concluida', cartao = {}, processo: mudancas = {} }: Mudancas = {}): ProcessoLido {
  const atual = ETAPAS[posicao - 1]
  contador += 1
  const lido: ProcessoLido = {
    id: `p${contador}`, nome, tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
    origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null,
    etapasDoProcesso: [],
    cartao: {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: dia(0), responsavelAtivo: true,
      caminho: ETAPAS.map((etapa, indice) => ({
        codigo: etapa.codigo, status: indice < posicao - 1 ? anteriores : indice === posicao - 1 ? 'em_andamento' : 'pendente',
      })),
      ultimaVersao: null, subprocessos: 0, ...cartao,
    },
    ...mudancas,
  }
  return { ...lido, etapasDoProcesso: mudancas.etapasDoProcesso ?? etapasDoProcesso(lido) }
}

/** O Quadro no aplicativo inteiro, com os processos dados; devolve o módulo falso para o teste conferir as gravações. */
export function montar(processos: ProcessoLido[], perfil: Perfil = 'integrante_ep', usuarios: UsuarioResponsavel[] = []): ProcessosFalso {
  const falso = new ProcessosFalso()
  falso.etapasDoCatalogo = ETAPAS
  falso.processos = processos
  falso.usuariosPossiveis = usuarios
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={new CadastrosFalso()} processos={falso} versoes={new VersoesFalso()} revisoes={new RevisoesFalso(falso)} planilhas={new PlanilhasFalso()} />)
  return falso
}

/** O cartão do processo pelo nome, depois que o Quadro carregou. */
export async function cartaoDe(nome: string): Promise<HTMLElement> {
  const nomeNoCartao = await screen.findByText(nome, { selector: '.cartao-nome' })
  return nomeNoCartao.closest('a') as HTMLElement
}
