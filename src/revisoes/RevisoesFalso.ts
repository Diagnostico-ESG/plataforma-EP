import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ProcessoLido, UltimaVersao, UsuarioResponsavel } from '../processos/tipos'
import { FRASE_DO_ESCOPO_OBRIGATORIO, FRASE_DO_ESCOPO_SO_NA_CORRIGIDA } from './frasesDeRevisao'
import { opcoesDaRevisao } from './opcoesDaRevisao'
import { eventoDaAprovacao } from './eventoDaAprovacao'
import type { VersoesFalso } from '../versoes/VersoesFalso'
import { conferirAprovacao, voltaDesfazAprovacao } from './conferirAprovacao'
import type { Aprovacao, DadosDaAprovacao, DadosDaRevisao, ModuloDeRevisoes, RevisaoInterna } from './tipos'

// O mesmo dia fixo da falsa de processos: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** As recusas do banco para a revisão: escopo e quem pode revisar a versão mais recente (as regras de opcoesDaRevisao). */
function conferirRevisao(ultima: UltimaVersao | null, usuarioId: string, dados: DadosDaRevisao): void {
  if (dados.resultado === 'sem_alteracao' && dados.escopo !== null) throw new TravaDoBanco(FRASE_DO_ESCOPO_SO_NA_CORRIGIDA)
  if (dados.resultado === 'corrigida' && dados.escopo === null) throw new TravaDoBanco(FRASE_DO_ESCOPO_OBRIGATORIO)
  const opcoes = opcoesDaRevisao(ultima, usuarioId)
  const opcao = dados.resultado === 'corrigida' ? opcoes.corrigida : opcoes.semAlteracao
  if (!opcao.disponivel) throw new TravaDoBanco(opcao.motivo ?? opcoes.bloqueio ?? '')
}

/**
 * Implementação falsa de revisões e aprovação para os testes de tela: sem rede, com falhas e esperas programáveis. Concluir a
 * revisão ou a aprovação conclui a etapa na falsa de processos, como a função do banco faz numa gravação só; voltar a uma
 * etapa da Aprovação ou anterior desfaz a aprovação (e tira a marca da versão na falsa de versões).
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
  /** As conclusões da Aprovação que chegaram ao banco, na ordem. */
  aprovacoesConcluidas: { andamentoId: string; dados: DadosDaAprovacao; responsavelId: string | null }[] = []
  /** As conclusões que chegaram ao banco, na ordem. */
  conclusoes: { andamentoId: string; dados: DadosDaRevisao; responsavelId: string | null }[] = []
  private proximoId = 1
  private readonly processos: ProcessosFalso | undefined
  private readonly usuario: UsuarioResponsavel
  private readonly versoes: VersoesFalso | undefined

  /**
   * `processos` é a falsa onde as etapas vivem; `usuario` é quem está na tela (o revisor); `versoes` é a falsa onde a versão
   * aprovada ganha e perde a marca. Ocupa `processos.aoVoltar` para desfazer a aprovação na volta de etapa.
   */
  constructor(processos?: ProcessosFalso, usuario: UsuarioResponsavel = { id: 'usuario-de-teste', nome: 'Pessoa de Teste' },
    versoes?: VersoesFalso) {
    this.processos = processos
    this.usuario = usuario
    this.versoes = versoes
    if (processos) processos.aoVoltar = (processoId, etapaCodigo) => this.desfazerAprovacaoNaVolta(processoId, etapaCodigo)
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

  async concluirRevisaoInterna(andamentoId: string, dados: DadosDaRevisao, responsavelId: string | null): Promise<void> {
    if (this.falhaNaGravacao !== null) {
      throw typeof this.falhaNaGravacao === 'string' ? new Error(this.falhaNaGravacao) : this.falhaNaGravacao
    }
    if (this.segurarGravacao) await new Promise<never>(() => {})
    const processo = this.processoDaEtapa(andamentoId)
    conferirRevisao(processo.ultimaVersao, this.usuario.id, dados)
    // Conclui primeiro: a recusa da conclusão (responsável, processo parado) não deixa a revisão, como no banco.
    await (this.processos as ProcessosFalso).concluirEtapa(andamentoId, responsavelId)
    this.conclusoes.push({ andamentoId, dados, responsavelId })
    this.guardar(processo, dados)
  }

  async concluirAprovacao(andamentoId: string, dados: DadosDaAprovacao, responsavelId: string | null): Promise<void> {
    if (this.falhaNaGravacao !== null) {
      throw typeof this.falhaNaGravacao === 'string' ? new Error(this.falhaNaGravacao) : this.falhaNaGravacao
    }
    if (this.segurarGravacao) await new Promise<never>(() => {})
    const processo = this.processoDaEtapa(andamentoId)
    const ultimaRevisao = (this.revisoes[processo.id] ?? []).map((revisao) => revisao.revisadaEm).sort().pop() ?? null
    conferirAprovacao(dados, {
      jaAprovado: processo.id in this.aprovacoes, ultima: processo.ultimaVersao, ultimaRevisao, hoje: HOJE,
    })
    // Conclui primeiro: a recusa da conclusão (processo parado, responsável) não deixa a aprovação, como no banco.
    await (this.processos as ProcessosFalso).concluirEtapa(andamentoId, responsavelId)
    this.aprovacaoConcluida(andamentoId, processo, dados, responsavelId)
  }

  private aprovacaoConcluida(andamentoId: string, processo: ProcessoLido, dados: DadosDaAprovacao, responsavelId: string | null): void {
    const versao = (processo.ultimaVersao as UltimaVersao).numero
    this.aprovacoes[processo.id] = {
      id: `ap${this.proximoId++}`, versao, numeroEprotocolo: dados.numeroEprotocolo, link: dados.link,
      aprovadaEm: dados.aprovadaEm, registradaPor: this.usuario.nome, registradaEm: `${HOJE}T12:00:00Z`,
    }
    if (this.versoes) this.versoes.aprovadas[processo.id] = versao
    this.aprovacoesConcluidas.push({ andamentoId, dados, responsavelId })
    this.registrarEvento(processo, 'registrar', this.aprovacoes[processo.id])
  }

  // Como a função voltar_a_etapa do banco: voltar para a Aprovação ou antes dela apaga a aprovação, com o evento "desfazer".
  private desfazerAprovacaoNaVolta(processoId: string, etapaCodigo: string): void {
    const aprovacao = this.aprovacoes[processoId]
    const processo = this.processos?.processos.find((outro) => outro.id === processoId)
    if (!aprovacao || !processo || !voltaDesfazAprovacao(processo.etapasDoProcesso, etapaCodigo)) return
    delete this.aprovacoes[processoId]
    if (this.versoes) delete this.versoes.aprovadas[processoId]
    this.registrarEvento(processo, 'desfazer', aprovacao)
  }

  private registrarEvento(processo: ProcessoLido, acao: 'registrar' | 'desfazer', aprovacao: Aprovacao): void {
    const historico = (this.processos as ProcessosFalso).historicoDosProcessos
    historico[processo.id] = [eventoDaAprovacao(processo, acao, aprovacao), ...(historico[processo.id] ?? [])]
  }

  private processoDaEtapa(andamentoId: string): ProcessoLido {
    if (!this.processos) throw new Error('RevisoesFalso sem ProcessosFalso: monte new RevisoesFalso(processos, usuario)')
    const processo = this.processos.processos.find((outro) => outro.etapasDoProcesso.some((etapa) => etapa.id === andamentoId))
    if (!processo) throw new CadastroInexistente()
    return processo
  }

  private guardar(processo: ProcessoLido, dados: DadosDaRevisao): void {
    const ultima = processo.ultimaVersao as UltimaVersao
    const corrigida = dados.resultado === 'corrigida'
    const revisao: RevisaoInterna = {
      id: `r${this.proximoId++}`,
      versaoRevisada: corrigida ? (ultima.anterior as { numero: number }).numero : ultima.numero,
      versaoCorrigida: corrigida ? ultima.numero : null,
      resultado: dados.resultado, escopo: corrigida ? dados.escopo : null, comentario: dados.comentario,
      revisor: this.usuario.nome, revisadaEm: HOJE,
    }
    this.revisoes[processo.id] = [revisao, ...(this.revisoes[processo.id] ?? [])]
  }
}
