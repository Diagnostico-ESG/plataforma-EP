import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { CODIGO_DA_APROVACAO, CODIGO_DA_REVISAO_INTERNA } from '../processos/codigosDasEtapas'
import { FRASE_SEM_VERSAO } from '../processos/frasesDaVersaoCompleta'
import { etapasDoVersoDe } from '../processos/movimentoFalso'
import { hojeLocal } from '../processos/textoDaReuniao'
import type { ProcessosFalso } from '../processos/ProcessosFalso'
import { conferirProcessoEmAndamento } from '../processos/situacaoFalso'
import type { ProcessoLido, UsuarioResponsavel } from '../processos/tipos'
import { conferirLinkEData } from './conferirAprovacao'
import { eventoDaAprovacao } from './eventoDaAprovacao'
import { eventoDaRevisao } from './eventoDaRevisao'
import {
  FRASE_DA_CORRIGIDA_SEM_VERSAO_NA_PASSAGEM, FRASE_DA_REVISAO_FORA_DA_ETAPA, FRASE_DA_REVISAO_JA_REGISTRADA,
  FRASE_DO_ESCOPO_OBRIGATORIO, FRASE_DO_ESCOPO_SO_NA_CORRIGIDA,
} from './frasesDeRevisao'
import { FRASE_DA_APROVACAO_FORA_DA_ETAPA } from './frasesDeAprovacao'
import type {
  Aprovacao, DadosDaAprovacao, DadosDaEdicaoDaRevisao, DadosDaRevisao, ModuloDeRevisoes, RevisaoInterna,
} from './tipos'
import { versoesDaRevisao } from './versoesDaRevisao'

// O mesmo dia fixo da falsa de processos: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** O escopo só vale na "corrigida" e lá é obrigatório: o banco o confere ao registrar e ao editar. */
function conferirEscopo(resultado: RevisaoInterna['resultado'], escopo: RevisaoInterna['escopo']): void {
  if (resultado === 'sem_alteracao' && escopo !== null) throw new TravaDoBanco(FRASE_DO_ESCOPO_SO_NA_CORRIGIDA)
  if (resultado === 'corrigida' && escopo === null) throw new TravaDoBanco(FRASE_DO_ESCOPO_OBRIGATORIO)
}

// As versões do resultado; "corrigida" sem versão enviada na passagem (ou sem anterior) é recusada como o banco.
function versoesOuRecusa(processo: ProcessoLido, resultado: RevisaoInterna['resultado']) {
  const versoes = versoesDaRevisao(processo.ultimaVersao, resultado)
  if (versoes === null && processo.ultimaVersao !== null) throw new TravaDoBanco(FRASE_DA_CORRIGIDA_SEM_VERSAO_NA_PASSAGEM)
  if (versoes === null) throw new TravaDoBanco(FRASE_SEM_VERSAO)
  return versoes
}


/**
 * Implementação falsa de revisões e aprovação para os testes de tela: sem rede, com falhas e esperas programáveis. Lê a
 * passagem aberta e a última versão da falsa de processos e recusa como o banco (etapa, versão, uma revisão por passagem).
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
  /** A passagem pela Revisão interna (a contagem delas) em que cada revisão registrada aqui nasceu, pelo id. */
  private readonly passagemDe: Record<string, number> = {}
  private proximoId = 1
  private readonly processos: ProcessosFalso | undefined
  private readonly usuario: UsuarioResponsavel

  /** `processos` é a falsa onde os processos vivem; `usuario` é quem está na tela (quem registra e edita). */
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
    const processo = this.processos?.processos.find((outro) => outro.id === processoId)
    return (this.revisoes[processoId] ?? []).map((revisao) => this.comAPassagem(processo, revisao))
  }

  async registrarRevisao(processoId: string, dados: DadosDaRevisao): Promise<void> {
    await this.esperarAGravacao()
    const processo = this.processoPorId(processoId)
    conferirProcessoEmAndamento(processo)
    if (processo.etapaAtual?.codigo !== CODIGO_DA_REVISAO_INTERNA) throw new TravaDoBanco(FRASE_DA_REVISAO_FORA_DA_ETAPA)
    const passagem = this.passagensPelaRevisao(processo)
    if ((this.revisoes[processoId] ?? []).some((revisao) => this.comAPassagem(processo, revisao).daPassagemAberta)) {
      throw new TravaDoBanco(FRASE_DA_REVISAO_JA_REGISTRADA)
    }
    conferirEscopo(dados.resultado, dados.escopo)
    const versoes = versoesOuRecusa(processo, dados.resultado)
    const nova: RevisaoInterna = {
      id: `r${this.proximoId++}`, versaoRevisada: versoes.revisada, versaoCorrigida: versoes.corrigida, resultado: dados.resultado,
      escopo: dados.escopo, comentario: dados.comentario, revisor: this.usuario.nome, revisadaEm: HOJE, daPassagemAberta: true,
    }
    this.passagemDe[nova.id] = passagem
    this.revisoes[processoId] = [nova, ...(this.revisoes[processoId] ?? [])]
    this.noHistorico(processo, eventoDaRevisao(processo, 'registrar', nova, this.usuario.nome))
  }

  async registrarAprovacao(processoId: string, dados: DadosDaAprovacao): Promise<void> {
    await this.esperarAGravacao()
    const processo = this.processoPorId(processoId)
    conferirProcessoEmAndamento(processo)
    if (processo.etapaAtual?.codigo !== CODIGO_DA_APROVACAO) throw new TravaDoBanco(FRASE_DA_APROVACAO_FORA_DA_ETAPA)
    if (processo.ultimaVersao === null) throw new TravaDoBanco(FRASE_SEM_VERSAO)
    conferirLinkEData(dados, HOJE)
    const anterior = this.aprovacoes[processoId]
    const nova: Aprovacao = {
      id: anterior?.id ?? `ap${this.proximoId++}`, versao: processo.ultimaVersao.numero, numeroEprotocolo: dados.numeroEprotocolo,
      link: dados.link, aprovadaEm: dados.aprovadaEm, registradaPor: this.usuario.nome, registradaEm: `${HOJE}T12:00:00Z`,
    }
    this.aprovacoes[processoId] = nova
    this.noHistorico(processo, eventoDaAprovacao(processo, anterior ? 'substituir' : 'registrar', nova, anterior))
  }

  async editarRevisao(revisaoId: string, dados: DadosDaEdicaoDaRevisao): Promise<void> {
    await this.esperarAGravacao()
    const processo = this.processoDoRegistro((id) => (this.revisoes[id] ?? []).some((revisao) => revisao.id === revisaoId))
    const antes = this.revisoes[processo.id].find((revisao) => revisao.id === revisaoId) as RevisaoInterna
    conferirProcessoEmAndamento(processo)
    conferirEscopo(dados.resultado, dados.escopo)
    const versoes = dados.resultado === antes.resultado ? null : versoesOuRecusa(processo, dados.resultado)
    const depois: RevisaoInterna = {
      ...antes, resultado: dados.resultado, escopo: dados.escopo, comentario: dados.comentario,
      ...(versoes && { versaoRevisada: versoes.revisada, versaoCorrigida: versoes.corrigida }),
    }
    this.revisoes[processo.id] = this.revisoes[processo.id].map((revisao) => (revisao.id === revisaoId ? depois : revisao))
    const mudou = antes.resultado !== depois.resultado || antes.escopo !== depois.escopo || antes.comentario !== depois.comentario
    if (mudou) this.noHistorico(processo, eventoDaRevisao(processo, 'editar', depois, this.usuario.nome, antes))
  }

  async editarAprovacao(aprovacaoId: string, dados: DadosDaAprovacao): Promise<void> {
    await this.esperarAGravacao()
    const processo = this.processoDoRegistro((id) => this.aprovacoes[id]?.id === aprovacaoId)
    const antes = this.aprovacoes[processo.id]
    conferirProcessoEmAndamento(processo)
    conferirLinkEData(dados, HOJE)
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

  // Quantas vezes o processo já passou pela Revisão interna (a aberta é a última a entrar): identifica a passagem atual.
  private passagensPelaRevisao(processo: ProcessoLido): number {
    const etapas = etapasDoVersoDe(processo, (this.processos as ProcessosFalso).etapasDoCatalogo, hojeLocal())
    return etapas.find((etapa) => etapa.codigo === CODIGO_DA_REVISAO_INTERNA)?.passagens.length ?? 0
  }

  // A revisão registrada aqui é "da passagem aberta" enquanto o processo estiver na Revisão interna na mesma passagem;
  // a posta à mão pelo teste traz o próprio `daPassagemAberta`.
  private comAPassagem(processo: ProcessoLido | undefined, revisao: RevisaoInterna): RevisaoInterna {
    const passagem = this.passagemDe[revisao.id]
    if (passagem === undefined || !processo) return revisao
    const aberta = processo.etapaAtual?.codigo === CODIGO_DA_REVISAO_INTERNA && this.passagensPelaRevisao(processo) === passagem
    return { ...revisao, daPassagemAberta: aberta }
  }

  private processoPorId(processoId: string): ProcessoLido {
    const processo = this.processos?.processos.find((outro) => outro.id === processoId)
    if (!processo) throw new CadastroInexistente()
    return processo
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
