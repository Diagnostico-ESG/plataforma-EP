import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from '../processos/tipos'
import { RevisoesFalso } from '../revisoes/RevisoesFalso'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { agoraDoVerso } from './versoDoCartao'

// O verso do processo no aplicativo inteiro, com a Aprovação pelo setor em andamento sob quem está na tela (ticket 03 de
// revisoes-aprovacao): as fixtures e os atalhos das duas suítes de tela da aprovação.

export const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
export const BIA = { id: 'u2', nome: 'Bia Teste' }
export const REVISAO_DO_SETOR = 'Revisão pelo setor'
export const APROVACAO = 'Aprovação pelo setor'
export const PUBLICACAO = 'Publicação'
export const TITULO_DA_JANELA = `Concluir ${APROVACAO} e iniciar ${PUBLICACAO}`
export const BOTAO_DA_JANELA = `Concluir e iniciar ${PUBLICACAO}`
export const COMPLETA = ['bpmn', 'png', 'relatorio'] as const

export const versao = (papeis: UltimaVersao['papeis'] = [...COMPLETA]): UltimaVersao =>
  ({ numero: 8, autorId: BIA.id, autorNome: BIA.nome, papeis })

export function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

export const CONCLUIDA = { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11' } as const

export function caminho(publicacao: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso[] {
  return [
    doProcesso(3, 'revisao_interna', 'Revisão interna', CONCLUIDA),
    doProcesso(4, 'revisao_setor', REVISAO_DO_SETOR, CONCLUIDA),
    doProcesso(5, 'aprovacao_setor', APROVACAO, {
      status: 'em_andamento', iniciadaEm: '2026-10-12', responsavelId: EU.id, responsavelNome: EU.nome,
    }),
    doProcesso(6, 'publicacao', PUBLICACAO, publicacao),
  ]
}

export function processo(ultimaVersao: UltimaVersao | null, etapas: EtapaDoProcesso[]): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: 'aprovacao_setor', nome: APROVACAO, ordem: 5 },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao, etapasDoProcesso: etapas,
  }
}

export type Falsos = { falso: ProcessosFalso; revisoes: RevisoesFalso; versoes: VersoesFalso }
export type Opcoes = {
  perfil?: Perfil
  mudancas?: Partial<ProcessoLido>
  publicacao?: Partial<EtapaDoProcesso>
  /** Troca o caminho de etapas do processo. */
  etapas?: EtapaDoProcesso[]
  /** Prepara os falsos antes de o aplicativo montar (as leituras começam ao montar). */
  ajustar?: (falsos: Falsos) => void
}

// O verso do processo no aplicativo inteiro, com a Aprovação em andamento sob quem está na tela.
export function montar(ultimaVersao: UltimaVersao | null, { perfil = 'integrante_ep', mudancas = {}, publicacao, etapas: outras, ajustar }: Opcoes = {}) {
  window.location.hash = '#/processos/p1'
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const etapas = outras ?? caminho(publicacao)
  const falso = new ProcessosFalso()
  falso.processos = [{ ...processo(ultimaVersao, etapas), ...mudancas }]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = etapas.map((etapa) => ({ id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true }))
  const versoes = new VersoesFalso()
  const revisoes = new RevisoesFalso(falso, EU, versoes)
  ajustar?.({ falso, revisoes, versoes })
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso}
    versoes={versoes} revisoes={revisoes} />)
  return { falso, revisoes, versoes }
}

export const abrirAJanela = async (titulo = TITULO_DA_JANELA, concluir = `Concluir ${APROVACAO}`) => {
  fireEvent.click((await agoraDoVerso()).getByRole('button', { name: concluir }))
  return within(await screen.findByRole('dialog', { name: titulo }))
}
export type Janela = ReturnType<typeof within>
export const botao = (janela: Janela, nome = BOTAO_DA_JANELA) => janela.getByRole('button', { name: nome }) as HTMLButtonElement
export const campo = (janela: Janela, nome: RegExp) => janela.getByLabelText(nome) as HTMLInputElement
