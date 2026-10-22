import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { CatalogoFalso } from './CatalogoFalso'
import {
  avancarProcesso, conferirAutorDaProxima, conferirAutorDaRevisao, conferirAvanco, conferirDatasDaEtapa,
  conferirResponsavelEscolhido, conferirVersaoDaRevisaoDoSetor, mudarEtapaDoProcesso, responsavelDoCartao, trocarEtapaDoProcesso, voltarEtapas,
  type PedidoDeAvanco,
} from './andamentoFalso'
import {
  conferirPai, conferirSemSubprocessos, estruturaDoProcesso, levarMacroprocessoAosFilhos, macroprocessoDo, reclassificar,
} from './reclassificacaoFalso'
import { escolhaDaVolta, escolhaDoAvanco } from './publicacaoFalso'
import { conferirProcessoEmAndamento, mudarSituacao } from './situacaoFalso'
import type {
  DadosDoProcesso, DatasDaEtapa, EtapaDoCatalogo, EtapaDoProcesso, EtapaDoCaminho, ListaDeProcessos,
  ModuloDeProcessos, ProcessoLido, Reclassificacao, UsuarioResponsavel,
} from './tipos'

type ChamadaDeEtapa = {
  acao: string; id: string; nota?: string; datas?: DatasDaEtapa; usuarioId?: string | null; vai?: boolean | null
}
type TrocaDeEtapas = <T extends EtapaDoCaminho>(etapas: T[]) => T[]
const RESOLVIDAS = ['concluida', 'realizada_anteriormente', 'dispensada']

// Dia fixo: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** Implementação falsa de processos para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class ProcessosFalso implements ModuloDeProcessos {
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As ações gravadas, na ordem. */
  chamadas: ChamadaDeEtapa[] = []
  /** Quem pode ser escolhido como responsável de uma etapa (ativos, Administrador ou Integrante). */
  usuariosPossiveis: UsuarioResponsavel[] = []
  /** Os processos cadastrados; a lista e a leitura partem daqui. */
  processos: ProcessoLido[] = []
  /** As etapas de nível processo do catálogo, na ordem dele (as colunas do Quadro). */
  etapasDoCatalogo: EtapaDoCatalogo[] = []
  /** O histórico de cada processo (pelo id do processo), do mais recente para o mais antigo. */
  historicoDosProcessos: Record<string, EventoDoCadastro[]> = {}
  /** Chamado ao fim de cada volta de etapa, com o processo e o código da etapa reaberta (a falsa de revisões desfaz a aprovação). */
  aoVoltar: ((processoId: string, etapaCodigo: string) => void) | null = null
  /** Sigla e nome que o banco juntaria ao cartão (pelo id do setor e do macroprocesso). */
  siglasDosSetores: Record<string, string> = {}
  nomesDosMacroprocessos: Record<string, string> = {}
  falharListaDeProcessos = false
  segurarListaDeProcessos = false
  falharLeituraDoProcesso = false
  segurarLeituraDoProcesso = false
  falharHistoricoDoProcesso = false
  segurarHistoricoDoProcesso = false
  /** O catálogo inteiro; as gravações nele mudam `etapasDoCatalogo` e os processos. */
  catalogo = new CatalogoFalso(this)
  private proximoId = 1

  async iniciarEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'iniciar', id }, { status: 'em_andamento', iniciadaEm: HOJE })
  }

  async concluirEtapa(id: string, usuarioId: string | null, vai?: boolean | null): Promise<void> {
    this.avancar({ acao: 'concluir', id, usuarioId, ...(vai != null && { vai }) }, { status: 'concluida', resolvidaEm: HOJE })
  }

  async dispensarEtapa(id: string, nota: string, usuarioId: string | null): Promise<void> {
    this.avancar({ acao: 'dispensar', id, nota, usuarioId }, { status: 'dispensada', nota, resolvidaEm: HOJE })
  }

  async registrarRealizadaAnteriormente(id: string, nota: string, usuarioId: string | null, vai?: boolean | null): Promise<void> {
    this.avancar({ acao: 'realizada', id, nota, usuarioId, ...(vai != null && { vai }) }, { status: 'realizada_anteriormente', nota, resolvidaEm: HOJE })
  }

  // Como a função de voltar do banco: a reaberta recebe o responsável (null limpa o que tinha) e a trava do autor vale aqui também.
  async voltarParaEtapa(id: string, motivo: string, usuarioId: string | null): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    this.conferirProcessoDaEtapa(id)
    if (motivo.trim() === '') throw new TravaDoBanco('O motivo é obrigatório.')
    if (!RESOLVIDAS.includes(etapa.status)) throw new TravaDoBanco(`A etapa ${etapa.nome} ainda não foi resolvida.`)
    conferirResponsavelEscolhido(usuarioId, this.usuariosPossiveis)
    this.conferirAutorDaEtapa(etapa as EtapaDoProcesso, usuarioId)
    this.chamadas.push({ acao: 'voltar', id, nota: motivo, usuarioId })
    this.trocarProcessoDaEtapa(id, (processo) => ({ ...processo, vaiParaPublicacao: escolhaDaVolta(processo, etapa.codigo) }))
    this.aplicar(id, (etapas) => voltarEtapas(etapas, id, HOJE))
    this.porResponsavel(id, usuarioId)
    this.aoVoltar?.(this.processoDaEtapa(id).id, etapa.codigo)
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

  async reclassificarProcesso(id: string, reclassificacao: Reclassificacao, motivo: string): Promise<void> {
    this.conferirGravacao()
    const mudado = reclassificar(this.processos, this.acharProcesso(id), reclassificacao, motivo)
    this.processos = this.processos.map((processo) => (processo.id === id ? mudado : processo))
  }

  async corrigirDatasDaEtapa(id: string, datas: DatasDaEtapa): Promise<void> {
    this.conferirGravacao()
    this.acharEtapa(id)
    conferirDatasDaEtapa(datas, HOJE)
    this.mudar({ acao: 'datas', id, datas }, { iniciadaEm: datas.iniciadaEm, resolvidaEm: datas.resolvidaEm })
  }

  async mudarResponsavelDaEtapa(id: string, usuarioId: string | null): Promise<void> {
    this.conferirGravacao()
    this.conferirAutorDaEtapa(this.acharEtapa(id) as EtapaDoProcesso, usuarioId)
    this.mudar({ acao: 'responsavel', id, usuarioId }, {})
    this.porResponsavel(id, usuarioId)
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
    return processo ? { ...processo, ...estruturaDoProcesso(this.processos, processo) } : null
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
    this.acharProcesso(id)
    this.chamadas.push(data === null ? { acao: 'reuniao', id } : { acao: 'reuniao', id, nota: data })
    this.processos = this.processos.map((processo) => (processo.id === id ? { ...processo, dataDaReuniao: data } : processo))
  }

  async excluirProcesso(id: string): Promise<void> {
    this.conferirGravacao()
    this.acharProcesso(id)
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

  // O processo novo nasce com todas as etapas ativas do catálogo pendentes.
  // Os testes carregam processos com ids fixos (p1, p2…): o processo novo não pode repetir um deles.
  private idLivreDeProcesso(): string {
    let id = `p${this.proximoId++}`
    while (this.processos.some((processo) => processo.id === id)) id = `p${this.proximoId++}`
    return id
  }

  private processoNovo(dados: DadosDoProcesso): ProcessoLido {
    const etapas = this.etapasDoCatalogo.filter((etapa) => etapa.ativa)
    const primeira = etapas[0]
    return {
      ...dados, ...this.nomesDoCartao(dados), id: this.idLivreDeProcesso(), situacao: 'em_andamento',
      etapaAtual: primeira ? { codigo: primeira.codigo, nome: primeira.nome, ordem: primeira.ordem } : null,
      responsavel: null, motivoDaSituacao: null, processoPai: null, subprocessos: [], dataDaReuniao: null, ultimaVersao: null,
      etapasDoProcesso: etapas.map((etapa) => ({
        id: `a${this.proximoId++}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, obrigatoria: true,
        status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null,
        responsavelInativo: false,
      })),
    }
  }

  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  // A etapa de algum processo; que ela não existe (mais) é o aviso de cadastro inexistente.
  private acharEtapa(id: string): EtapaDoCaminho {
    const todas: EtapaDoCaminho[] = this.processos.flatMap((processo) => processo.etapasDoProcesso)
    const etapa = todas.find((candidata) => candidata.id === id)
    if (!etapa) throw new CadastroInexistente()
    return etapa
  }

  // Como a função de avanço do banco: confere, resolve a etapa e inicia a próxima, ou não muda nada.
  private avancar(chamada: ChamadaDeEtapa & { acao: PedidoDeAvanco['acao'] }, mudancas: Partial<EtapaDoProcesso>): void {
    this.conferirGravacao()
    const etapa = this.acharEtapa(chamada.id)
    this.conferirProcessoDaEtapa(chamada.id)
    const responsavelId = chamada.usuarioId ?? null
    conferirAvanco(etapa, { acao: chamada.acao, nota: chamada.nota ?? null, responsavelId }, this.usuariosPossiveis)
    if (chamada.acao === 'concluir') conferirVersaoDaRevisaoDoSetor(etapa, this.processoDaEtapa(chamada.id).ultimaVersao)
    conferirAutorDaProxima(this.processoDaEtapa(chamada.id), chamada.id, responsavelId)
    const vaiParaPublicacao = escolhaDoAvanco(this.processoDaEtapa(chamada.id), chamada.id, chamada.vai)
    this.chamadas.push(chamada)
    const usuario = this.usuariosPossiveis.find((possivel) => possivel.id === responsavelId) ?? null
    this.trocarProcessoDaEtapa(chamada.id, (processo) =>
      avancarProcesso({ ...processo, vaiParaPublicacao }, chamada.id, mudancas, usuario, HOJE))
  }

  private mudar(chamada: ChamadaDeEtapa, mudancas: Partial<EtapaDoProcesso>): void {
    this.conferirGravacao()
    this.conferirProcessoDaEtapa(chamada.id)
    this.chamadas.push(chamada)
    this.aplicar(chamada.id, (etapas) => etapas.map((etapa) => (etapa.id === chamada.id ? { ...etapa, ...mudancas } : etapa)))
  }

  // O responsável da etapa e, sendo ela a atual, o do cartão (quem não está entre os possíveis fica sem nome).
  private porResponsavel(id: string, usuarioId: string | null): void {
    const usuario = this.usuariosPossiveis.find((possivel) => possivel.id === usuarioId) ?? null
    const mudancas = { responsavelId: usuarioId, responsavelNome: usuario?.nome ?? null, responsavelInativo: false }
    const cartao = usuario ? { id: usuario.id, nome: usuario.nome, fotoUrl: null } : null
    this.processos = this.processos.map((processo) => responsavelDoCartao(mudarEtapaDoProcesso(processo, id, mudancas), id, cartao))
  }

  // A trava do autor da versão mais recente na Revisão interna, como o gatilho do banco.
  private conferirAutorDaEtapa(etapa: EtapaDoProcesso, usuarioId: string | null): void {
    conferirAutorDaRevisao(this.processoDaEtapa(etapa.id).ultimaVersao, etapa, usuarioId)
  }

  private processoDaEtapa(idDaEtapa: string): ProcessoLido {
    return this.processos.find((processo) => processo.etapasDoProcesso.some((etapa) => etapa.id === idDaEtapa)) as ProcessoLido
  }

  // O processo que tem a etapa: parado, ele recusa qualquer mudança nelas.
  private conferirProcessoDaEtapa(idDaEtapa: string): void {
    const dono = this.processos.find((processo) => processo.etapasDoProcesso.some((etapa) => etapa.id === idDaEtapa))
    if (dono) conferirProcessoEmAndamento(dono)
  }

  private acharProcesso(id: string): ProcessoLido {
    const processo = this.processos.find((outro) => outro.id === id)
    if (!processo) throw new CadastroInexistente()
    return processo
  }

  private mudarSituacaoDoProcesso(id: string, nova: 'em_andamento' | 'suspenso' | 'cancelado', motivo: string): void {
    this.conferirGravacao()
    const mudado = mudarSituacao(this.acharProcesso(id), nova, motivo)
    this.processos = this.processos.map((processo) => (processo.id === id ? mudado : processo))
  }

  private trocarProcessoDaEtapa(idDaEtapa: string, trocar: (processo: ProcessoLido) => ProcessoLido): void {
    this.processos = this.processos.map((processo) => (
      processo.etapasDoProcesso.some((etapa) => etapa.id === idDaEtapa) ? trocar(processo) : processo))
  }

  private aplicar(id: string, trocar: TrocaDeEtapas): void {
    this.processos = this.processos.map((processo) => trocarEtapaDoProcesso(processo, id, trocar))
  }
}
