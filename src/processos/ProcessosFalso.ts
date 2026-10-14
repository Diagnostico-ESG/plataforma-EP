import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { EventoDoCadastro } from '../cadastros/tipos'
import {
  atualizarSetorDoProcesso, conferirDatasDaEtapa, responsavelDoCartao, trocarEtapaDoProcesso, voltarEtapas,
} from './andamentoFalso'
import type {
  DadosDoProcesso, DadosDoResponsavel, DatasDaEtapa, EtapaDoCatalogo, EtapaDoProcesso, EtapaDoSetor, ListaDeProcessos,
  ModuloDeProcessos, ProcessoLido, ResponsavelDoSetor, UsuarioResponsavel,
} from './tipos'

type ChamadaDeEtapa = { acao: string; id: string; nota?: string; datas?: DatasDaEtapa; usuarioId?: string | null }
type TrocaDeEtapas = <T extends EtapaDoSetor>(etapas: T[]) => T[]
const RESOLVIDAS = ['concluida', 'realizada_anteriormente', 'dispensada']

// Dia fixo: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** Implementação falsa de processos para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class ProcessosFalso implements ModuloDeProcessos {
  /** As etapas de cada setor (pelo id do setor), na ordem do catálogo. */
  etapasDoSetor: Record<string, EtapaDoSetor[]> = {}
  falharLeitura = false
  segurarLeitura = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As ações gravadas, na ordem. */
  chamadas: ChamadaDeEtapa[] = []
  /** Os responsáveis de cada setor (pelo id do setor). Leitura e gravação seguem as falhas acima. */
  responsaveisDoSetor: Record<string, ResponsavelDoSetor[]> = {}
  /** Quem pode ser escolhido como responsável de uma etapa (ativos, Administrador ou Integrante). */
  usuariosPossiveis: UsuarioResponsavel[] = []
  /** Os processos cadastrados; a lista e a leitura partem daqui. */
  processos: ProcessoLido[] = []
  /** As etapas de nível processo do catálogo, na ordem dele (as colunas do Quadro). */
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
  private proximoId = 1

  async lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.etapasDoSetor[setorId] ?? [])]
  }

  async iniciarEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'iniciar', id }, { status: 'em_andamento', iniciadaEm: HOJE })
  }

  async concluirEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'concluir', id }, { status: 'concluida', resolvidaEm: HOJE })
  }

  async dispensarEtapa(id: string, nota: string): Promise<void> {
    this.mudar({ acao: 'dispensar', id, nota }, { status: 'dispensada', nota, resolvidaEm: HOJE })
  }

  async registrarRealizadaAnteriormente(id: string, nota: string): Promise<void> {
    this.mudar({ acao: 'realizada', id, nota }, { status: 'realizada_anteriormente', nota, resolvidaEm: HOJE })
  }

  async voltarParaEtapa(id: string, motivo: string): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    if (motivo.trim() === '') throw new TravaDoBanco('O motivo é obrigatório.')
    if (!RESOLVIDAS.includes(etapa.status)) throw new TravaDoBanco(`A etapa ${etapa.nome} ainda não foi resolvida.`)
    this.chamadas.push({ acao: 'voltar', id, nota: motivo })
    this.aplicar(id, (etapas) => voltarEtapas(etapas, id, HOJE))
  }

  async corrigirDatasDaEtapa(id: string, datas: DatasDaEtapa): Promise<void> {
    this.conferirGravacao()
    this.acharEtapa(id)
    conferirDatasDaEtapa(datas, HOJE)
    this.mudar({ acao: 'datas', id, datas }, { iniciadaEm: datas.iniciadaEm, resolvidaEm: datas.resolvidaEm })
  }

  async mudarResponsavelDaEtapa(id: string, usuarioId: string | null): Promise<void> {
    this.conferirGravacao()
    this.acharEtapa(id)
    const usuario = this.usuariosPossiveis.find((possivel) => possivel.id === usuarioId) ?? null
    this.mudar({ acao: 'responsavel', id, usuarioId }, {
      responsavelId: usuarioId, responsavelNome: usuario?.nome ?? null, responsavelInativo: false,
    })
    const cartao = usuario ? { id: usuario.id, nome: usuario.nome, fotoUrl: null } : null
    this.processos = this.processos.map((processo) => responsavelDoCartao(processo, id, cartao))
  }

  async listarResponsaveisPossiveis(): Promise<UsuarioResponsavel[]> {
    return [...this.usuariosPossiveis]
  }

  async lerResponsaveisDoSetor(setorId: string): Promise<ResponsavelDoSetor[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.responsaveisDoSetor[setorId] ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }

  async criarResponsavel(setorId: string, dados: DadosDoResponsavel): Promise<void> {
    this.conferirGravacao()
    const novo = { id: `r${this.proximoId++}`, ...dados }
    this.responsaveisDoSetor[setorId] = [...(this.responsaveisDoSetor[setorId] ?? []), novo]
  }

  async editarResponsavel(id: string, dados: DadosDoResponsavel): Promise<void> {
    this.conferirGravacao()
    this.mudarResponsaveis((lista) => lista.map((responsavel) => (responsavel.id === id ? { id, ...dados } : responsavel)))
  }

  async excluirResponsavel(id: string): Promise<void> {
    this.conferirGravacao()
    this.mudarResponsaveis((lista) => lista.filter((responsavel) => responsavel.id !== id))
  }

  async listarProcessos(): Promise<ListaDeProcessos> {
    if (this.segurarListaDeProcessos) return new Promise<never>(() => {})
    if (this.falharListaDeProcessos) throw new Error('falha de conexão simulada')
    return { etapas: [...this.etapasDoCatalogo], processos: [...this.processos] }
  }

  async lerProcesso(id: string): Promise<ProcessoLido | null> {
    if (this.segurarLeituraDoProcesso) return new Promise<never>(() => {})
    if (this.falharLeituraDoProcesso) throw new Error('falha de conexão simulada')
    return this.processos.find((processo) => processo.id === id) ?? null
  }

  async lerHistoricoDoProcesso(id: string): Promise<EventoDoCadastro[]> {
    if (this.segurarHistoricoDoProcesso) return new Promise<never>(() => {})
    if (this.falharHistoricoDoProcesso) throw new Error('falha de conexão simulada')
    return [...(this.historicoDosProcessos[id] ?? [])]
  }

  async criarProcesso(dados: DadosDoProcesso): Promise<void> {
    this.conferirGravacao()
    this.conferirNomeNovo(dados)
    this.processos = [...this.processos, this.processoNovo(dados)]
  }

  async editarProcesso(id: string, dados: DadosDoProcesso): Promise<void> {
    this.conferirGravacao()
    const atual = this.processos.find((processo) => processo.id === id)
    if (!atual) throw new CadastroInexistente()
    this.conferirNomeNovo(dados, id)
    // A edição não muda o tipo (a mudança é a reclassificação).
    const campos: Partial<DadosDoProcesso> = { ...dados }
    delete campos.tipo
    this.processos = this.processos.map((processo) => (processo.id === id ? { ...processo, ...this.nomesDoCartao(dados), ...campos } : processo))
  }

  async excluirProcesso(id: string): Promise<void> {
    this.conferirGravacao()
    if (!this.processos.some((processo) => processo.id === id)) throw new CadastroInexistente()
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

  // O processo novo nasce com todas as etapas ativas do catálogo pendentes; aguarda o setor se as dele não estão resolvidas.
  private processoNovo(dados: DadosDoProcesso): ProcessoLido {
    const etapas = this.etapasDoCatalogo.filter((etapa) => etapa.ativa)
    const primeira = etapas[0]
    return {
      ...dados, ...this.nomesDoCartao(dados), id: `p${this.proximoId++}`, situacao: 'em_andamento',
      etapaAtual: primeira ? { codigo: primeira.codigo, nome: primeira.nome, ordem: primeira.ordem } : null,
      aguardandoOSetor: (this.etapasDoSetor[dados.setorId] ?? []).some((etapa) => etapa.status === 'pendente' || etapa.status === 'em_andamento'),
      responsavel: null, motivoDaSituacao: null, etapasDoSetor: this.etapasDoSetor[dados.setorId] ?? [],
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

  private mudarResponsaveis(mudar: (lista: ResponsavelDoSetor[]) => ResponsavelDoSetor[]): void {
    for (const [setorId, lista] of Object.entries(this.responsaveisDoSetor)) this.responsaveisDoSetor[setorId] = mudar(lista)
  }

  // A etapa do setor ou do processo; que ela não existe (mais) é o aviso de cadastro inexistente.
  private acharEtapa(id: string): EtapaDoSetor {
    const todas: EtapaDoSetor[] = [
      ...Object.values(this.etapasDoSetor).flat(), ...this.processos.flatMap((processo) => processo.etapasDoProcesso),
    ]
    const etapa = todas.find((candidata) => candidata.id === id)
    if (!etapa) throw new CadastroInexistente()
    return etapa
  }

  private mudar(chamada: ChamadaDeEtapa, mudancas: Partial<EtapaDoProcesso>): void {
    this.conferirGravacao()
    this.chamadas.push(chamada)
    this.aplicar(chamada.id, (etapas) => etapas.map((etapa) => (etapa.id === chamada.id ? { ...etapa, ...mudancas } : etapa)))
  }

  private aplicar(id: string, trocar: TrocaDeEtapas): void {
    for (const [setorId, etapas] of Object.entries(this.etapasDoSetor)) this.etapasDoSetor[setorId] = trocar(etapas)
    // Só o setor que tem etapas cadastradas no falso recalcula "aguardando o setor"; o que o teste montou à mão fica como está.
    this.processos = this.processos.map((processo) => {
      const comEtapa = trocarEtapaDoProcesso(processo, id, trocar)
      const doSetor = this.etapasDoSetor[processo.setorId]
      return doSetor ? atualizarSetorDoProcesso(comEtapa, doSetor) : comEtapa
    })
  }
}
