import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessosFalso } from '../processos/ProcessosFalso'
import { conferirProcessoEmAndamento } from '../processos/situacaoFalso'
import type { ProcessoLido, UsuarioResponsavel } from '../processos/tipos'
import { FRASE_DO_ESCOPO_OBRIGATORIO, FRASE_DO_ESCOPO_SO_NA_CORRIGIDA } from './frasesDeRevisao'
import { eventoDaAprovacao } from './eventoDaAprovacao'
import { eventoDaRevisaoEditada } from './eventoDaRevisao'
import { conferirLinkEData } from './conferirAprovacao'
import type { Aprovacao, DadosDaAprovacao, DadosDaEdicaoDaRevisao, ModuloDeRevisoes, RevisaoInterna } from './tipos'

// O mesmo dia fixo da falsa de processos: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** O escopo só vale na "corrigida" e lá é obrigatório: o banco o confere na edição. */
function conferirEscopo(resultado: RevisaoInterna['resultado'], escopo: RevisaoInterna['escopo']): void {
  if (resultado === 'sem_alteracao' && escopo !== null) throw new TravaDoBanco(FRASE_DO_ESCOPO_SO_NA_CORRIGIDA)
  if (resultado === 'corrigida' && escopo === null) throw new TravaDoBanco(FRASE_DO_ESCOPO_OBRIGATORIO)
}

/**
 * Implementação falsa de revisões e aprovação para os testes de tela: sem rede, com falhas e esperas programáveis. Os
 * registros nascem direto em `revisoes` e `aprovacoes`; registrar revisão e aprovação sem trava chega no ticket 05 de
 * revisoes-aprovacao.
 */
export class RevisoesFalso implements ModuloDeRevisoes {
  /** As revisões gravadas, por processo, da mais recente para a mais antiga. */
  revisoes: Record<string, RevisaoInterna[]> = {}
  falharLeitura = false
  segurarLeitura = false
  /** Segura a gravação (para ver o "Salvando…"). */
  segurarGravacao = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaNaGravacao: string | Error | null = null
  /** A aprovação de cada processo (uma por processo). */
  aprovacoes: Record<string, Aprovacao> = {}
  private readonly processos: ProcessosFalso | undefined
  private readonly usuario: UsuarioResponsavel

  /** `processos` é a falsa onde os processos vivem; `usuario` é quem está na tela (quem edita). */
  constructor(processos?: ProcessosFalso, usuario: UsuarioResponsavel = { id: 'usuario-de-teste', nome: 'Pessoa de Teste' }) {
    this.processos = processos
    this.usuario = usuario
  }

  async lerAprovacao(processoId: string): Promise<Aprovacao | null> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return this.aprovacoes[processoId] ?? null
  }

  async listarRevisoes(processoId: string): Promise<RevisaoInterna[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.revisoes[processoId] ?? [])]
  }

  async editarRevisao(revisaoId: string, dados: DadosDaEdicaoDaRevisao): Promise<void> {
    await this.esperarAGravacao()
    const processo = this.processoDoRegistro((id) => (this.revisoes[id] ?? []).some((revisao) => revisao.id === revisaoId))
    const antes = this.revisoes[processo.id].find((revisao) => revisao.id === revisaoId) as RevisaoInterna
    conferirProcessoEmAndamento(processo)
    conferirEscopo(antes.resultado, dados.escopo)
    const depois: RevisaoInterna = { ...antes, escopo: dados.escopo, comentario: dados.comentario }
    this.revisoes[processo.id] = this.revisoes[processo.id].map((revisao) => (revisao.id === revisaoId ? depois : revisao))
    if (antes.escopo === depois.escopo && antes.comentario === depois.comentario) return
    this.noHistorico(processo, eventoDaRevisaoEditada(processo, antes, depois, this.usuario.nome))
  }

  async editarAprovacao(aprovacaoId: string, dados: DadosDaAprovacao): Promise<void> {
    await this.esperarAGravacao()
    const processo = this.processoDoRegistro((id) => this.aprovacoes[id]?.id === aprovacaoId)
    const antes = this.aprovacoes[processo.id]
    conferirProcessoEmAndamento(processo)
    conferirLinkEData(dados, this.ultimaRevisaoDe(processo.id), HOJE)
    const depois: Aprovacao = {
      ...antes, numeroEprotocolo: dados.numeroEprotocolo, link: dados.link, aprovadaEm: dados.aprovadaEm,
    }
    this.aprovacoes[processo.id] = depois
    const mudou = antes.numeroEprotocolo !== depois.numeroEprotocolo || antes.link !== depois.link || antes.aprovadaEm !== depois.aprovadaEm
    if (mudou) this.noHistorico(processo, eventoDaAprovacao(processo, 'editar', depois, antes))
  }

  // Falha e espera programadas pelo teste, antes de qualquer gravação.
  private async esperarAGravacao(): Promise<void> {
    if (this.falhaNaGravacao !== null) {
      throw typeof this.falhaNaGravacao === 'string' ? new Error(this.falhaNaGravacao) : this.falhaNaGravacao
    }
    if (this.segurarGravacao) await new Promise<never>(() => {})
  }

  // A data da última revisão interna do processo (a que limita a data da aprovação); null sem revisão.
  private ultimaRevisaoDe(processoId: string): string | null {
    return (this.revisoes[processoId] ?? []).map((revisao) => revisao.revisadaEm).sort().pop() ?? null
  }

  // O processo dono do registro (a revisão ou a aprovação que a edição acha); sumiu: o cadastro não existe mais.
  private processoDoRegistro(temORegistro: (processoId: string) => boolean): ProcessoLido {
    const processo = this.processos?.processos.find((outro) => temORegistro(outro.id))
    if (!processo) throw new CadastroInexistente()
    return processo
  }

  private noHistorico(processo: ProcessoLido, evento: EventoDoCadastro): void {
    const historico = (this.processos as ProcessosFalso).historicoDosProcessos
    historico[processo.id] = [evento, ...(historico[processo.id] ?? [])]
  }
}
