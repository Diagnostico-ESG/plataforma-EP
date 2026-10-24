import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { AnotacoesFalso } from './AnotacoesFalso'
import { CatalogoFalso } from './CatalogoFalso'
import { arquivar, conferirNaoArquivado, desarquivar } from './arquivamentoFalso'
import { CODIGO_CONCLUIDOS, CODIGO_NAO_INICIADOS } from './codigosDasEtapas'
import {
  conferirEtapaAtiva, conferirEtiquetaMutavel, etapaAtualNoCatalogo, etapasDoVersoDe, publicacaoDaChegada, registrarPassagem,
} from './movimentoFalso'
import {
  conferirPai, conferirSemSubprocessos, estruturaDoProcesso, levarMacroprocessoAosFilhos, macroprocessoDo, reclassificar,
} from './reclassificacaoFalso'
import { conferirProcessoEmAndamento, mudarSituacao } from './situacaoFalso'
import { hojeLocal } from './textoDaReuniao'
import type {
  DadosDaChegada, DadosDoProcesso, EtapaDoCatalogo, EtiquetaDaEtapa, ListaDeProcessos, ModuloDeProcessos, ProcessoLido,
  Reclassificacao, UsuarioResponsavel,
} from './tipos'

type ChamadaDeProcesso = {
  acao: string; id: string; nota?: string; etapaId?: string; etiqueta?: EtiquetaDaEtapa; usuarioId?: string | null
  chegada?: DadosDaChegada
}

/** Implementação falsa de processos para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class ProcessosFalso implements ModuloDeProcessos {
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As ações gravadas, na ordem. */
  chamadas: ChamadaDeProcesso[] = []
  /** Quem pode ser escolhido como responsável do processo (ativos, Administrador ou Integrante). */
  usuariosPossiveis: UsuarioResponsavel[] = []
  /** Quem está na tela: ao mover, esta pessoa vira o responsável (como `auth.uid()` no banco). */
  quemChama: UsuarioResponsavel = { id: 'usuario-de-teste', nome: 'Pessoa de Teste' }
  /** Os processos cadastrados; a lista e a leitura partem daqui. */
  processos: ProcessoLido[] = []
  /** As etapas do catálogo, na ordem dele (as colunas do Quadro). */
  etapasDoCatalogo: EtapaDoCatalogo[] = []
  /** O histórico de cada processo (pelo id do processo), do mais recente para o mais antigo. */
  historicoDosProcessos: Record<string, EventoDoCadastro[]> = {}
  /** Sigla e nome que o banco juntaria ao cartão (pelo id do setor e do macroprocesso). */
  siglasDosSetores: Record<string, string> = {}
  nomesDosMacroprocessos: Record<string, string> = {}
  falharListaDeProcessos = false
  segurarListaDeProcessos = false
  falharLeituraDoProcesso = false
  segurarLeituraDoProcesso = false
  falharHistoricoDoProcesso = false
  segurarHistoricoDoProcesso = false
  /** Segura as gravações de mover até o teste liberar (para ver o estado "gravando" e a ordem das respostas). */
  segurarMovimento: Promise<void> | null = null
  /** O catálogo inteiro; as gravações nele mudam `etapasDoCatalogo` e os processos. */
  catalogo = new CatalogoFalso(this)
  /** As Anotações dos processos (texto, autor e hora), com a falha, a espera e o "outra pessoa alterou" programáveis. */
  anotacoes = new AnotacoesFalso(this)
  private proximoId = 1

  lerAnotacoes = (id: string) => this.anotacoes.ler(id)

  gravarAnotacoes = (id: string, esperado: string | null, novo: string | null) => this.anotacoes.gravar(id, esperado, novo)

  // Como mover_processo: confere o processo e a etapa, e a própria etapa não grava nada. Quem move vira o responsável, a
  // etiqueta volta a A fazer (em Concluídos, Concluído) e a passagem aberta passa a ser a do destino.
  async moverProcesso(id: string, etapaId: string, chegada?: DadosDaChegada): Promise<void> {
    await this.segurarMovimento
    this.conferirGravacao()
    const processo = this.acharProcesso(id)
    conferirNaoArquivado(processo)
    conferirProcessoEmAndamento(processo)
    const destino = this.etapasDoCatalogo.find((etapa) => etapa.id === etapaId)
    if (!destino) throw new CadastroInexistente()
    conferirEtapaAtiva(destino)
    if (processo.etapaAtual?.codigo === destino.codigo) return
    const emConcluidos = destino.codigo === CODIGO_CONCLUIDOS
    const publicacao = emConcluidos ? publicacaoDaChegada(processo, chegada, hojeLocal()) : {}
    this.chamadas.push({ acao: 'mover', id, etapaId, ...(chegada && { chegada }) })
    this.trocarProcesso(id, (atual) => this.movido(atual, destino, publicacao))
  }

  async mudarEtiqueta(id: string, etiqueta: EtiquetaDaEtapa): Promise<void> {
    this.conferirGravacao()
    const processo = this.acharProcesso(id)
    conferirNaoArquivado(processo)
    conferirProcessoEmAndamento(processo)
    conferirEtiquetaMutavel(processo, etiqueta)
    this.chamadas.push({ acao: 'etiqueta', id, etiqueta })
    this.trocarProcesso(id, (atual) => ({ ...atual, etiqueta }))
  }

  async mudarResponsavel(id: string, usuarioId: string | null): Promise<void> {
    this.conferirGravacao()
    const processo = this.acharProcesso(id)
    conferirNaoArquivado(processo)
    conferirProcessoEmAndamento(processo)
    const usuario = this.usuariosPossiveis.find((possivel) => possivel.id === usuarioId) ?? null
    if (usuarioId !== null && usuario === null) {
      throw new TravaDoBanco(`${usuarioId} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.`)
    }
    this.chamadas.push({ acao: 'responsavel', id, usuarioId })
    this.trocarProcesso(id, (atual) => ({ ...atual, ...this.comResponsavel(atual, usuario) }))
  }

  async suspenderProcesso(id: string, motivo: string): Promise<void> {
    this.mudarSituacaoDoProcesso(id, 'suspenso', motivo)
  }

  async cancelarProcesso(id: string, motivo: string): Promise<void> {
    this.mudarSituacaoDoProcesso(id, 'cancelado', motivo)
  }

  async retomarProcesso(id: string, motivo: string): Promise<void> {
    this.mudarSituacaoDoProcesso(id, 'em_andamento', motivo)
  }

  async arquivar(id: string): Promise<void> {
    this.trocarProcesso(id, (processo) => arquivar(processo, `${hojeLocal()}T12:00:00Z`))
  }

  async desarquivar(id: string): Promise<void> {
    this.trocarProcesso(id, desarquivar)
  }

  async reclassificarProcesso(id: string, reclassificacao: Reclassificacao, motivo: string): Promise<void> {
    this.conferirGravacao()
    conferirNaoArquivado(this.acharProcesso(id))
    const mudado = reclassificar(this.processos, this.acharProcesso(id), reclassificacao, motivo)
    this.processos = this.processos.map((processo) => (processo.id === id ? mudado : processo))
  }

  async listarResponsaveisPossiveis(): Promise<UsuarioResponsavel[]> {
    return [...this.usuariosPossiveis]
  }

  async listarProcessos(): Promise<ListaDeProcessos> {
    if (this.segurarListaDeProcessos) return new Promise<never>(() => {})
    if (this.falharListaDeProcessos) throw new Error('falha de conexão simulada')
    return { etapas: [...this.etapasDoCatalogo], processos: [...this.processos] }
  }

  async lerProcesso(id: string): Promise<ProcessoLido | null> {
    if (this.segurarLeituraDoProcesso) return new Promise<never>(() => {})
    if (this.falharLeituraDoProcesso) throw new Error('falha de conexão simulada')
    const processo = this.processos.find((outro) => outro.id === id)
    if (!processo) return null
    const etapasDoVerso = etapasDoVersoDe(processo, this.etapasDoCatalogo, hojeLocal())
    return { ...processo, ...estruturaDoProcesso(this.processos, processo), etapasDoVerso }
  }

  async lerHistoricoDoProcesso(id: string): Promise<EventoDoCadastro[]> {
    if (this.segurarHistoricoDoProcesso) return new Promise<never>(() => {})
    if (this.falharHistoricoDoProcesso) throw new Error('falha de conexão simulada')
    return [...(this.historicoDosProcessos[id] ?? [])]
  }

  async criarProcesso(dados: DadosDoProcesso): Promise<string> {
    this.conferirGravacao()
    this.conferirNomeNovo(dados)
    // Como o gatilho do banco: o subprocesso tem pai do tipo Processo e adota o macroprocesso dele.
    const macroprocesso = dados.tipo === 'subprocesso' ? macroprocessoDo(conferirPai(this.processos, dados.processoPaiId)) : {}
    const novo = { ...this.processoNovo(dados), ...macroprocesso }
    this.processos = [...this.processos, novo]
    return novo.id
  }

  async editarProcesso(id: string, dados: DadosDoProcesso): Promise<void> {
    this.conferirGravacao()
    const atual = this.acharProcesso(id)
    conferirNaoArquivado(atual)
    this.conferirNomeNovo(dados, id)
    // A edição não muda tipo nem pai (a mudança é a reclassificação); o subprocesso fica no macroprocesso do pai.
    const campos: Partial<DadosDoProcesso> = { ...dados }
    delete campos.tipo
    delete campos.processoPaiId
    const pai = this.processos.find((processo) => processo.id === atual.processoPaiId)
    const editado = { ...atual, ...this.nomesDoCartao(dados), ...campos, ...(pai ? macroprocessoDo(pai) : {}) }
    this.processos = levarMacroprocessoAosFilhos(this.processos.map((processo) => (processo.id === id ? editado : processo)), editado)
  }

  // Como no banco, a data não depende da situação do processo nem mexe em etapa.
  async marcarReuniao(id: string, data: string | null): Promise<void> {
    this.conferirGravacao()
    conferirNaoArquivado(this.acharProcesso(id))
    this.chamadas.push(data === null ? { acao: 'reuniao', id } : { acao: 'reuniao', id, nota: data })
    this.processos = this.processos.map((processo) => (processo.id === id ? { ...processo, dataDaReuniao: data } : processo))
  }

  async excluirProcesso(id: string): Promise<void> {
    this.conferirGravacao()
    conferirNaoArquivado(this.acharProcesso(id))
    conferirSemSubprocessos(this.processos, id)
    this.processos = this.processos.filter((processo) => processo.id !== id)
  }

  // Imita o índice único do banco: o nome não se repete no setor, sem diferenciar maiúsculas.
  private conferirNomeNovo(dados: DadosDoProcesso, idDoProprio?: string): void {
    const repetido = this.processos.some((processo) => processo.id !== idDoProprio && processo.setorId === dados.setorId
      && processo.nome.toLowerCase() === dados.nome.toLowerCase())
    if (!repetido) return
    const sigla = this.siglasDosSetores[dados.setorId] ?? dados.setorId
    throw new TravaDoBanco(`Já existe um processo com o nome ${dados.nome} no setor ${sigla}.`)
  }

  private nomesDoCartao(dados: DadosDoProcesso) {
    return {
      setorSigla: this.siglasDosSetores[dados.setorId] ?? dados.setorId,
      macroprocessoNome: this.nomesDosMacroprocessos[dados.macroprocessoId] ?? dados.macroprocessoId,
    }
  }

  // Os testes carregam processos com ids fixos (p1, p2…): o processo novo não pode repetir um deles.
  private idLivreDeProcesso(): string {
    let id = `p${this.proximoId++}`
    while (this.processos.some((processo) => processo.id === id)) id = `p${this.proximoId++}`
    return id
  }

  // O processo novo entra em Não iniciados, com A fazer e sem responsável (cadastrar não é mover).
  private processoNovo(dados: DadosDoProcesso): ProcessoLido {
    const entrada = this.etapasDoCatalogo.find((etapa) => etapa.codigo === CODIGO_NAO_INICIADOS)
      ?? this.etapasDoCatalogo.find((etapa) => etapa.ativa)
    return {
      ...dados, ...this.nomesDoCartao(dados), id: this.idLivreDeProcesso(), situacao: 'em_andamento',
      etapaAtual: entrada ? etapaAtualNoCatalogo(entrada, this.etapasDoCatalogo) : null, etiqueta: 'a_fazer',
      entrouNaEtapaEm: hojeLocal(), responsavel: null, motivoDaSituacao: null, processoPai: null, subprocessos: [],
      etapasDoVerso: [], dataDaReuniao: null, ultimaVersao: null,
    }
  }

  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private acharProcesso(id: string): ProcessoLido {
    const processo = this.processos.find((outro) => outro.id === id)
    if (!processo) throw new CadastroInexistente()
    return processo
  }

  // O processo na etapa de destino: etiqueta, responsável e entrada novos, a passagem aberta trocada e a publicação da chegada.
  private movido(processo: ProcessoLido, destino: EtapaDoCatalogo, publicacao: Partial<ProcessoLido>): ProcessoLido {
    const hoje = hojeLocal()
    const emConcluidos = destino.codigo === CODIGO_CONCLUIDOS
    const origem = processo.etapaAtual?.codigo ?? ''
    const etapasDoVerso = registrarPassagem(etapasDoVersoDe(processo, this.etapasDoCatalogo, hoje), origem, destino.codigo, hoje)
    return {
      ...processo, ...publicacao, ...this.comResponsavel(processo, this.quemChama), etapasDoVerso,
      etapaAtual: etapaAtualNoCatalogo(destino, this.etapasDoCatalogo), etiqueta: emConcluidos ? 'concluido' : 'a_fazer',
      entrouNaEtapaEm: hoje, situacao: emConcluidos ? 'concluido' : 'em_andamento',
    }
  }

  private comResponsavel(processo: ProcessoLido, usuario: UsuarioResponsavel | null): Partial<ProcessoLido> {
    const responsavel = usuario ? { id: usuario.id, nome: usuario.nome, fotoUrl: null } : null
    return { responsavel, ...(processo.cartao && { cartao: { ...processo.cartao, responsavelAtivo: usuario ? true : null } }) }
  }

  private mudarSituacaoDoProcesso(id: string, nova: 'em_andamento' | 'suspenso' | 'cancelado', motivo: string): void {
    this.conferirGravacao()
    conferirNaoArquivado(this.acharProcesso(id))
    const mudado = mudarSituacao(this.acharProcesso(id), nova, motivo)
    this.processos = this.processos.map((processo) => (processo.id === id ? mudado : processo))
  }

  // Grava como as funções do banco: a falha programada, o processo que não existe mais e a regra da troca.
  private trocarProcesso(id: string, trocar: (processo: ProcessoLido) => ProcessoLido): void {
    this.conferirGravacao()
    const mudado = trocar(this.acharProcesso(id))
    this.processos = this.processos.map((processo) => (processo.id === id ? mudado : processo))
  }
}
