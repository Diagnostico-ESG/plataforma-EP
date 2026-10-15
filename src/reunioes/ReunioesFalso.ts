import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { estadoDoEventoDaReuniao } from './estadoDoEvento'
import { compararPorNome } from './ordemPorNome'
import {
  FRASE_DA_MODELAGEM_SEM_PROCESSO, FRASE_DA_SENSIBILIZACAO_COM_PROCESSO, fraseDoOutroParticipanteLongo,
  fraseDoProcessoDeOutroSetor, fraseDoResponsavelDeOutroSetor, fraseDoSetorInativo,
} from './recusasDeReunioes'
import type {
  DadosDaReuniao, ModuloDeReunioes, ProcessoDaReuniao, ResponsavelDaReuniao, Reuniao, SetorParaReuniao, UsuarioDaReuniao,
} from './tipos'

export type SetorDoFalso = SetorParaReuniao & { ativo: boolean }
export type GravacaoDeReuniao = { id: string | null; dados: DadosDaReuniao }

/** Implementação falsa de reuniões para os testes de tela: sem rede, com falhas, esperas e as recusas do banco. */
export class ReunioesFalso implements ModuloDeReunioes {
  /** As reuniões gravadas; a lista e a leitura partem daqui. */
  reunioes: Reuniao[] = []
  /** Os setores do cadastro, ativos ou não (a escolha do formulário só mostra os ativos). */
  setores: SetorDoFalso[] = []
  /** Os processos de cada setor (pelo id do setor), por nome. */
  processosDosSetores: Record<string, ProcessoDaReuniao[]> = {}
  /** O cadastro de usuários, ativos ou não (a escolha do formulário só mostra os ativos). */
  usuarios: UsuarioDaReuniao[] = []
  /** Os responsáveis de cada setor (pelo id do setor). */
  responsaveisDosSetores: Record<string, ResponsavelDaReuniao[]> = {}
  falharLeitura = false
  segurarLeitura = false
  falharLeituraDaReuniao = false
  segurarLeituraDaReuniao = false
  /** A leitura dos setores e dos processos do formulário. */
  falharOpcoes = false
  /** A leitura dos usuários e a dos responsáveis do setor, cada uma por si. */
  falharUsuarios = false
  segurarUsuarios = false
  falharResponsaveis = false
  segurarResponsaveis = false
  falharHistoricoDaReuniao = false
  segurarHistoricoDaReuniao = false
  falharEventosDoProcesso = false
  segurarEventosDoProcesso = false
  /** Os eventos que o banco gravaria, na ordem em que aconteceram (a leitura devolve do mais recente). */
  historico: EventoDoCadastro[] = []
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As gravações que o banco aceitou, na ordem. */
  gravacoes: GravacaoDeReuniao[] = []
  private proximoId = 1

  async listarReunioes(): Promise<Reuniao[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...this.reunioes]
  }

  async lerReuniao(id: string): Promise<Reuniao | null> {
    if (this.segurarLeituraDaReuniao) return new Promise<never>(() => {})
    if (this.falharLeituraDaReuniao) throw new Error('falha de conexão simulada')
    return this.reunioes.find((reuniao) => reuniao.id === id) ?? null
  }

  async listarSetoresAtivos(): Promise<SetorParaReuniao[]> {
    this.conferirOpcoes()
    return this.setores.filter((setor) => setor.ativo).map(({ id, sigla, nome }) => ({ id, sigla, nome }))
  }

  async listarProcessosDoSetor(setorId: string): Promise<ProcessoDaReuniao[]> {
    this.conferirOpcoes()
    return [...(this.processosDosSetores[setorId] ?? [])]
  }

  async listarUsuariosAtivos(): Promise<UsuarioDaReuniao[]> {
    if (this.segurarUsuarios) return new Promise<never>(() => {})
    if (this.falharUsuarios) throw new Error('falha de conexão simulada')
    this.conferirOpcoes()
    return this.usuarios.filter((usuario) => usuario.ativo).sort(compararPorNome)
  }

  async listarResponsaveisDoSetor(setorId: string): Promise<ResponsavelDaReuniao[]> {
    if (this.segurarResponsaveis) return new Promise<never>(() => {})
    if (this.falharResponsaveis) throw new Error('falha de conexão simulada')
    this.conferirOpcoes()
    return [...(this.responsaveisDosSetores[setorId] ?? [])].sort(compararPorNome)
  }

  async salvarReuniao(id: string | null, dados: DadosDaReuniao): Promise<void> {
    this.falharSeConfigurado()
    const anterior = this.reunioes.find((reuniao) => reuniao.id === id)
    if (id !== null && !anterior) throw new CadastroInexistente()
    const setor = this.setores.find((candidato) => candidato.id === dados.setorId)
    this.conferirRegras(dados, setor, anterior)
    const reuniao = this.montar(id ?? `r${this.proximoId++}`, dados, setor)
    this.reunioes = anterior ? this.reunioes.map((r) => (r.id === reuniao.id ? reuniao : r)) : [...this.reunioes, reuniao]
    this.gravacoes.push({ id, dados })
    this.registrarEvento(anterior, reuniao)
  }

  async excluirReuniao(id: string): Promise<void> {
    this.falharSeConfigurado()
    const anterior = this.reunioes.find((reuniao) => reuniao.id === id)
    if (!anterior) throw new CadastroInexistente()
    this.reunioes = this.reunioes.filter((reuniao) => reuniao.id !== id)
    this.registrarEvento(anterior, undefined)
  }

  /**
   * Imita o gatilho do banco: o responsável excluído sai das reuniões em que esteve e o nome dele passa a ser um dos
   * outros participantes (uma vez só), com um evento de alteração por reunião.
   */
  excluirResponsavelDoSetor(id: string): void {
    const responsavel = Object.values(this.responsaveisDosSetores).flat().find((candidato) => candidato.id === id)
    if (!responsavel) return
    for (const [setorId, lista] of Object.entries(this.responsaveisDosSetores)) {
      this.responsaveisDosSetores[setorId] = lista.filter((candidato) => candidato.id !== id)
    }
    this.reunioes = this.reunioes.map((reuniao) => this.semOResponsavel(reuniao, responsavel))
  }

  private semOResponsavel(reuniao: Reuniao, responsavel: ResponsavelDaReuniao): Reuniao {
    if (!reuniao.responsaveis.some((presente) => presente.id === responsavel.id)) return reuniao
    const outros = reuniao.outrosParticipantes
    const depois: Reuniao = {
      ...reuniao, responsaveis: reuniao.responsaveis.filter((presente) => presente.id !== responsavel.id),
      outrosParticipantes: outros.includes(responsavel.nome) ? outros : [...outros, responsavel.nome],
    }
    this.registrarEvento(reuniao, depois)
    return depois
  }

  async lerHistoricoDaReuniao(id: string): Promise<EventoDoCadastro[]> {
    if (this.segurarHistoricoDaReuniao) return new Promise<never>(() => {})
    if (this.falharHistoricoDaReuniao) throw new Error('falha de conexão simulada')
    return this.historico.filter((evento) => evento.entidadeRef === id).reverse()
  }

  async lerEventosDeReuniaoDoProcesso(processoId: string): Promise<EventoDoCadastro[]> {
    if (this.segurarEventosDoProcesso) return new Promise<never>(() => {})
    if (this.falharEventosDoProcesso) throw new Error('falha de conexão simulada')
    const cita = (estado: EventoDoCadastro['antes']) =>
      Array.isArray(estado?.processos) && (estado.processos as { id: string }[]).some((processo) => processo.id === processoId)
    return this.historico.filter((evento) => cita(evento.antes) || cita(evento.depois)).reverse()
  }

  // Um evento por gravação, com o estado completo; gravação sem mudança não gera evento (como o banco).
  private registrarEvento(antes: Reuniao | undefined, depois: Reuniao | undefined): void {
    const estadoAntes = antes ? estadoDoEventoDaReuniao(antes) : null
    const estadoDepois = depois ? estadoDoEventoDaReuniao(depois) : null
    if (JSON.stringify(estadoAntes) === JSON.stringify(estadoDepois)) return
    const acao = !antes ? 'criar' : !depois ? 'excluir' : 'editar'
    this.historico.push({
      id: this.historico.length + 1, ocorridoEm: new Date().toISOString(), autor: 'Pessoa de Teste', acao,
      entidade: 'reuniao', entidadeRef: (depois ?? antes)?.id ?? '', antes: estadoAntes, depois: estadoDepois,
    })
  }

  private falharSeConfigurado(): void {
    if (typeof this.falhaDeGravacao === 'string') throw new Error(this.falhaDeGravacao)
    if (this.falhaDeGravacao) throw this.falhaDeGravacao
  }

  private conferirOpcoes(): void {
    if (this.falharOpcoes) throw new Error('falha de conexão simulada')
  }

  // As recusas do banco: setor inativo só para reunião nova ou setor trocado; tipo e processos; processo de outro setor.
  private conferirRegras(dados: DadosDaReuniao, setor: SetorDoFalso | undefined, anterior: Reuniao | undefined): void {
    const trocouDeSetor = !anterior || anterior.setorId !== dados.setorId
    if (setor && !setor.ativo && trocouDeSetor) throw new TravaDoBanco(fraseDoSetorInativo(setor.sigla))
    conferirTipoEProcessos(dados)
    const doSetor = this.processosDosSetores[dados.setorId] ?? []
    const fora = dados.processosIds.find((processoId) => !doSetor.some((processo) => processo.id === processoId))
    if (fora) throw new TravaDoBanco(fraseDoProcessoDeOutroSetor(this.nomeDoProcesso(fora)))
    this.conferirParticipantes(dados)
  }

  // Responsável de outro setor e outro participante longo demais, como o banco os recusa.
  private conferirParticipantes(dados: DadosDaReuniao): void {
    const doSetor = this.responsaveisDosSetores[dados.setorId] ?? []
    const fora = dados.responsaveisIds.find((responsavelId) => !doSetor.some((responsavel) => responsavel.id === responsavelId))
    if (fora) throw new TravaDoBanco(fraseDoResponsavelDeOutroSetor(this.nomeDoResponsavel(fora)))
    const longo = dados.outrosParticipantes.find((nome) => nome.length > 200)
    if (longo) throw new TravaDoBanco(fraseDoOutroParticipanteLongo(String(longo.length)))
  }

  private nomeDoResponsavel(id: string): string {
    const todos = Object.values(this.responsaveisDosSetores).flat()
    return todos.find((responsavel) => responsavel.id === id)?.nome ?? id
  }

  private nomeDoProcesso(id: string): string {
    const todos = Object.values(this.processosDosSetores).flat()
    return todos.find((processo) => processo.id === id)?.nome ?? id
  }

  private montar(id: string, dados: DadosDaReuniao, setor: SetorDoFalso | undefined): Reuniao {
    const doSetor = this.processosDosSetores[dados.setorId] ?? []
    return {
      id, tipo: dados.tipo, setorId: dados.setorId, setorSigla: setor?.sigla ?? dados.setorId, setorAtivo: setor?.ativo ?? true,
      data: dados.data, hora: dados.hora, local: dados.local, anotacoes: dados.anotacoes,
      outrosParticipantes: dados.outrosParticipantes,
      // Por nome, como o módulo real devolve (reuniaoDaLinha).
      processos: doSetor.filter((processo) => dados.processosIds.includes(processo.id)).sort(compararPorNome),
      usuarios: this.usuarios.filter((usuario) => dados.usuariosIds.includes(usuario.id)).sort(compararPorNome),
      responsaveis: (this.responsaveisDosSetores[dados.setorId] ?? [])
        .filter((responsavel) => dados.responsaveisIds.includes(responsavel.id)).sort(compararPorNome),
    }
  }
}

function conferirTipoEProcessos({ tipo, processosIds }: DadosDaReuniao): void {
  if (tipo === 'modelagem' && !processosIds.length) throw new TravaDoBanco(FRASE_DA_MODELAGEM_SEM_PROCESSO)
  if (tipo === 'sensibilizacao' && processosIds.length) throw new TravaDoBanco(FRASE_DA_SENSIBILIZACAO_COM_PROCESSO)
}
