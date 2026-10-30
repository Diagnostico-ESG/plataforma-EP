import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { CODIGO_NAO_INICIADOS, CODIGO_CONCLUIDOS, ehEtapaFixa } from './codigosDasEtapas'
import {
  FRASE_DAS_ETAPAS_FIXAS, fraseDaEtapaComProcessos, fraseDaEtapaProtegida, fraseDaEtapaUsada, fraseDeCodigoRepetido,
  FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS, fraseDeNomeRepetido,
} from './frasesDoCatalogo'
import type {
  DadosDaEtapa, EtapaDoCatalogo, EtapaNoCatalogo, EtapaNova, ModuloDoCatalogo, ProcessoLido, SentidoDaOrdem,
  UsuarioResponsavel,
} from './tipos'

/** O que o catálogo falso lê e mexe no `ProcessosFalso` (sem importá-lo, para não criar dependência circular). */
export type DonoDoCatalogo = {
  processos: ProcessoLido[]
  etapasDoCatalogo: EtapaDoCatalogo[]
  usuariosPossiveis: UsuarioResponsavel[]
}

// Como o gatilho do banco: as seis etapas com campos próprios não se desativam nem se excluem.
const PROTEGIDAS = ['modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_setor', 'aprovacao_setor', 'publicacao']

const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem

function conferirNaoFixa(etapa: EtapaNoCatalogo): void {
  if (ehEtapaFixa(etapa.codigo)) throw new TravaDoBanco(FRASE_DAS_ETAPAS_FIXAS)
}

function conferirNaoProtegida(etapa: EtapaNoCatalogo): void {
  if (PROTEGIDAS.includes(etapa.codigo)) throw new TravaDoBanco(fraseDaEtapaProtegida(etapa.nome))
}

/** Implementação falsa do catálogo para os testes: muda as colunas do Quadro e confere os processos do dono. */
export class CatalogoFalso implements ModuloDoCatalogo {
  /** O catálogo inteiro, ativas e inativas. */
  etapas: EtapaNoCatalogo[] = []
  falharLeitura = false
  segurarLeitura = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  private proximoId = 1
  private readonly dono: DonoDoCatalogo

  constructor(dono: DonoDoCatalogo) {
    this.dono = dono
  }

  async listarCatalogo(): Promise<EtapaNoCatalogo[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...this.etapas].sort(porOrdem)
  }

  // Sem posição, a etapa nova entra logo antes de Concluídos; nunca antes de Não iniciados.
  async acrescentarEtapa(dados: EtapaNova): Promise<void> {
    this.conferirGravacao()
    this.conferirRepetida(dados.nome, dados.codigo)
    const concluidos = this.etapas.find((etapa) => etapa.codigo === CODIGO_CONCLUIDOS)
    const antes = this.etapas.find((etapa) => etapa.id === dados.antesDe) ?? concluidos
    if (!antes) throw new CadastroInexistente()
    if (antes.codigo === CODIGO_NAO_INICIADOS) throw new TravaDoBanco(FRASE_DAS_ETAPAS_FIXAS)
    const nova: EtapaNoCatalogo = {
      id: `c${this.proximoId++}`, codigo: dados.codigo, nome: dados.nome.trim(), ordem: antes.ordem, fase: dados.fase, ativa: true,
    }
    const abertas = this.etapas.map((etapa) => (etapa.ordem >= antes.ordem ? { ...etapa, ordem: etapa.ordem + 1 } : etapa))
    this.gravar([...abertas, nova])
  }

  async editarEtapa(id: string, dados: DadosDaEtapa): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    conferirNaoFixa(etapa)
    this.conferirRepetida(dados.nome, null, id)
    this.gravar(this.etapas.map((outra) => (outra.id === id ? { ...outra, ...dados, nome: dados.nome.trim() } : outra)))
  }

  async moverEtapa(id: string, sentido: SentidoDaOrdem): Promise<void> {
    this.conferirGravacao()
    const movida = this.acharEtapa(id)
    const ordenadas = [...this.etapas].sort(porOrdem)
    const vizinha = ordenadas[ordenadas.indexOf(movida) + (sentido === 'subir' ? -1 : 1)]
    if (!vizinha) return
    // As fixas ficam nas pontas: trocar com uma delas, ou mover uma delas, desfaria isso.
    if (ehEtapaFixa(movida.codigo) || ehEtapaFixa(vizinha.codigo)) throw new TravaDoBanco(FRASE_DAS_ETAPAS_FIXAS)
    const trocar = (etapa: EtapaNoCatalogo) => {
      if (etapa.id === movida.id) return { ...etapa, ordem: vizinha.ordem }
      return etapa.id === vizinha.id ? { ...etapa, ordem: movida.ordem } : etapa
    }
    this.gravar(this.etapas.map(trocar))
  }

  async desativarEtapa(id: string): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    conferirNaoFixa(etapa)
    conferirNaoProtegida(etapa)
    this.conferirSemProcessos(etapa, 'desativar')
    this.gravar(this.etapas.map((outra) => (outra.id === id ? { ...outra, ativa: false } : outra)))
  }

  async reativarEtapa(id: string): Promise<void> {
    this.conferirGravacao()
    this.acharEtapa(id)
    this.gravar(this.etapas.map((outra) => (outra.id === id ? { ...outra, ativa: true } : outra)))
  }

  async excluirEtapa(id: string): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    conferirNaoFixa(etapa)
    conferirNaoProtegida(etapa)
    this.conferirSemProcessos(etapa, 'excluir')
    if (this.jaRecebeuProcessos(etapa)) throw new TravaDoBanco(fraseDaEtapaUsada(etapa.nome))
    this.gravar(this.etapas.filter((outra) => outra.id !== id))
  }

  // Como o gatilho do banco. O falso não conhece o perfil de quem está em usuariosPossiveis (todos são Administrador ou
  // Integrante ativos por definição), então guarda integrante_ep.
  async definirResponsavelInicial(id: string, usuarioId: string | null): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    const usuario = this.dono.usuariosPossiveis.find((possivel) => possivel.id === usuarioId)
    if (usuarioId !== null && etapa.codigo === CODIGO_CONCLUIDOS) throw new TravaDoBanco(FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS)
    if (usuarioId !== null && !usuario) {
      throw new TravaDoBanco(`${usuarioId} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.`)
    }
    const responsavelInicial = usuario
      ? { id: usuario.id, nome: usuario.nome, fotoUrl: usuario.fotoUrl ?? null, ativo: true, perfil: 'integrante_ep' as const }
      : null
    this.etapas = this.etapas.map((outra) => (outra.id === id ? { ...outra, responsavelInicial } : outra))
  }

  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private acharEtapa(id: string): EtapaNoCatalogo {
    const etapa = this.etapas.find((outra) => outra.id === id)
    if (!etapa) throw new CadastroInexistente()
    return etapa
  }

  // Imita os índices únicos do banco: nome sem diferenciar maiúsculas e código.
  private conferirRepetida(nome: string, codigo: string | null, idDaPropria?: string): void {
    const outras = this.etapas.filter((etapa) => etapa.id !== idDaPropria)
    if (outras.some((etapa) => etapa.nome.toLowerCase() === nome.trim().toLowerCase())) throw new TravaDoBanco(fraseDeNomeRepetido(nome))
    if (outras.some((etapa) => etapa.codigo === codigo)) throw new TravaDoBanco(fraseDeCodigoRepetido(codigo ?? ''))
  }

  // Os processos que estão na etapa agora (a passagem aberta), de qualquer situação.
  private processosNaEtapa(etapa: EtapaNoCatalogo): number {
    return this.dono.processos.filter((processo) => processo.etapaAtual?.codigo === etapa.codigo).length
  }

  private conferirSemProcessos(etapa: EtapaNoCatalogo, acao: 'desativar' | 'excluir'): void {
    const dentro = this.processosNaEtapa(etapa)
    if (dentro > 0) throw new TravaDoBanco(fraseDaEtapaComProcessos(etapa.nome, dentro, acao))
  }

  // Por onde passou algum processo, aberta ou fechada: a que já recebeu processo não se apaga.
  private jaRecebeuProcessos(etapa: EtapaNoCatalogo): boolean {
    return this.dono.processos.some((processo) => processo.etapasDoVerso.some((visitada) => visitada.codigo === etapa.codigo && visitada.passagens.length > 0))
  }

  // O Quadro passa a mostrar as etapas na ordem nova.
  private gravar(etapas: EtapaNoCatalogo[]): void {
    this.etapas = etapas
    this.dono.etapasDoCatalogo = [...etapas].sort(porOrdem)
      .map(({ id, codigo, nome, ordem, ativa }) => ({ id, codigo, nome, ordem, ativa }))
  }
}
