import type { EventoDoCadastro } from '../cadastros/tipos'

export type StatusDaEtapa ='pendente' | 'em_andamento' | 'concluida' | 'realizada_anteriormente' | 'dispensada'

/** Uma etapa do catálogo num setor (o andamento): o id é o do andamento, que as ações recebem. */
export type EtapaDoSetor = {
  id: string
  codigo: string
  nome: string
  ordem: number
  obrigatoria: boolean
  status: StatusDaEtapa
  nota: string | null
  iniciadaEm: string | null
  resolvidaEm: string | null
}

/** Pessoa do setor atendido que responde por ele junto ao EP. */
export type ResponsavelDoSetor = { id: string; nome: string; email: string | null; cargo: string | null }

export type DadosDoResponsavel = Omit<ResponsavelDoSetor, 'id'>

export type TipoDeProcesso = 'processo' | 'subprocesso' | 'a_classificar'
export type OrigemDoProcesso = 'novo' | 'retomado'
/** A situação calculada: "concluido" não é guardado, vem de as etapas obrigatórias estarem resolvidas. */
export type SituacaoDoProcesso = 'em_andamento' | 'suspenso' | 'cancelado' | 'concluido'

/** Uma etapa do catálogo de nível processo, como as colunas do Quadro a usam. */
export type EtapaDoCatalogo = { id: string; codigo: string; nome: string; ordem: number; ativa: boolean }

export type NivelDaEtapa = 'setor' | 'processo'

/** Uma etapa do catálogo como a Administração a mostra: ativa ou não, de qualquer nível. */
export type EtapaNoCatalogo = EtapaDoCatalogo & { nivel: NivelDaEtapa; obrigatoria: boolean }

/** O que o formulário de etapa nova grava; `antesDe` null põe a etapa no fim. */
export type EtapaNova = { codigo: string; nome: string; nivel: NivelDaEtapa; obrigatoria: boolean; antesDe: string | null }

/** O que a edição muda: código e nível não mudam depois de criados. */
export type DadosDaEtapa = { nome: string; obrigatoria: boolean }

export type SentidoDaOrdem = 'subir' | 'descer'

/** A manutenção do catálogo (só o administrador; a RLS decide). Recusas como no módulo de processos. */
export type ModuloDoCatalogo = {
  /** Todas as etapas, ativas e inativas, na ordem. */
  listarCatalogo(): Promise<EtapaNoCatalogo[]>
  acrescentarEtapa(etapa: EtapaNova): Promise<void>
  editarEtapa(id: string, dados: DadosDaEtapa): Promise<void>
  /** Troca com a vizinha; na ponta, nada muda. */
  moverEtapa(id: string, sentido: SentidoDaOrdem): Promise<void>
  /** Some de onde estava pendente e continua onde já foi usada (ADR 0004). */
  desativarEtapa(id: string): Promise<void>
  /** Volta como pendente onde falta. */
  reativarEtapa(id: string): Promise<void>
  /** Só a etapa nunca usada. */
  excluirEtapa(id: string): Promise<void>
}

export type ResponsavelDaEtapa = { id: string; nome: string; fotoUrl: string | null }

/** Um processo como o Quadro e a Lista o mostram: com a etapa atual, o responsável dela e a situação calculada. */
export type ProcessoDaLista = {
  id: string
  nome: string
  tipo: TipoDeProcesso
  setorId: string
  setorSigla: string
  macroprocessoId: string
  macroprocessoNome: string
  /** Só no subprocesso. */
  processoPaiId: string | null
  situacao: SituacaoDoProcesso
  etapaAtual: { codigo: string; nome: string; ordem: number } | null
  /** As etapas do setor ainda não foram resolvidas: o processo espera na coluna "Aguardando o setor". */
  aguardandoOSetor: boolean
  responsavel: ResponsavelDaEtapa | null
}

export type ListaDeProcessos = { etapas: EtapaDoCatalogo[]; processos: ProcessoDaLista[] }

/** Uma etapa do processo (o andamento): como a do setor, com o nome de quem responde por ela. */
export type EtapaDoProcesso = EtapaDoSetor & {
  responsavelId: string | null
  responsavelNome: string | null
  /** O responsável foi desativado depois de escolhido: aparece marcado e não se escolhe de novo. */
  responsavelInativo: boolean
}

/** As datas de uma etapa como o banco as guarda (AAAA-MM-DD); null onde a etapa não tem a data. */
export type DatasDaEtapa = { iniciadaEm: string | null; resolvidaEm: string | null }

/** Quem pode ser responsável por uma etapa: usuário ativo de perfil Administrador ou Integrante. */
export type UsuarioResponsavel = { id: string; nome: string }

/** Um processo citado no painel de outro (o pai ou um subprocesso): abre o painel dele. */
export type ItemDaEstrutura = { id: string; nome: string }

export type ProcessoLido = ProcessoDaLista & {
  origem: OrigemDoProcesso
  contexto: string | null
  observacoes: string | null
  motivoDaSituacao: string | null
  /** O pai do subprocesso; null nos outros tipos. */
  processoPai: ItemDaEstrutura | null
  /** Os subprocessos do processo, por nome. */
  subprocessos: ItemDaEstrutura[]
  /** Só para leitura no painel do processo; na ordem do catálogo. */
  etapasDoSetor: EtapaDoSetor[]
  etapasDoProcesso: EtapaDoProcesso[]
  /** A data da reunião de modelagem piloto (AAAA-MM-DD), passada ou futura; null quando não marcada. */
  dataDaReuniao: string | null
}

/**
 * O que o formulário grava. Tipo e pai só valem no cadastro: a edição não os muda (a mudança é a reclassificação).
 * No subprocesso, o banco põe o macroprocesso do pai.
 */
export type DadosDoProcesso = {
  nome: string
  setorId: string
  macroprocessoId: string
  tipo: TipoDeProcesso
  /** Só no subprocesso. */
  processoPaiId: string | null
  origem: OrigemDoProcesso
  contexto: string | null
  observacoes: string | null
}

/** O tipo novo de uma reclassificação; o pai só no subprocesso. Nada volta a "a classificar". */
export type Reclassificacao = { tipo: Exclude<TipoDeProcesso, 'a_classificar'>; processoPaiId: string | null }

/**
 * Único ponto por onde a interface fala com o banco em processos e etapas. Recusa do banco chega como TravaDoBanco,
 * com a frase pronta; outra falha, como Error cuja mensagem é o motivo em português;
 * etapa, responsável ou processo que já não existe, como CadastroInexistente.
 */
export type ModuloDeProcessos = {
  /** Todos os processos por nome, mais as etapas de nível processo do catálogo, na ordem dele. */
  listarProcessos(): Promise<ListaDeProcessos>
  /** null: o processo não existe (mais). */
  lerProcesso(id: string): Promise<ProcessoLido | null>
  criarProcesso(dados: DadosDoProcesso): Promise<void>
  editarProcesso(id: string, dados: DadosDoProcesso): Promise<void>
  excluirProcesso(id: string): Promise<void>
  /** Marca, troca ou (com null) remove a data da reunião de modelagem piloto; vale em qualquer situação do processo. */
  marcarReuniao(id: string, data: string | null): Promise<void>
  /** Do mais recente para o mais antigo. */
  lerHistoricoDoProcesso(id: string): Promise<EventoDoCadastro[]>
  /** Na ordem do catálogo. */
  lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]>
  iniciarEtapa(andamentoId: string): Promise<void>
  concluirEtapa(andamentoId: string): Promise<void>
  dispensarEtapa(andamentoId: string, nota: string): Promise<void>
  registrarRealizadaAnteriormente(andamentoId: string, nota: string): Promise<void>
  /** A etapa resolvida volta a em andamento e as seguintes a pendente; o motivo é obrigatório. */
  voltarParaEtapa(andamentoId: string, motivo: string): Promise<void>
  corrigirDatasDaEtapa(andamentoId: string, datas: DatasDaEtapa): Promise<void>
  /** null tira o responsável. */
  mudarResponsavelDaEtapa(andamentoId: string, usuarioId: string | null): Promise<void>
  /** Suspender, cancelar e retomar pedem motivo; com o processo parado, nenhuma etapa dele muda. */
  suspenderProcesso(id: string, motivo: string): Promise<void>
  cancelarProcesso(id: string, motivo: string): Promise<void>
  retomarProcesso(id: string, motivo: string): Promise<void>
  /** Muda o tipo com motivo, mantendo o mesmo item; ao virar subprocesso, ele passa ao macroprocesso do pai. */
  reclassificarProcesso(id: string, reclassificacao: Reclassificacao, motivo: string): Promise<void>
  /** Por nome. */
  listarResponsaveisPossiveis(): Promise<UsuarioResponsavel[]>
  /** Em ordem alfabética de nome. */
  lerResponsaveisDoSetor(setorId: string): Promise<ResponsavelDoSetor[]>
  criarResponsavel(setorId: string, dados: DadosDoResponsavel): Promise<void>
  editarResponsavel(id: string, dados: DadosDoResponsavel): Promise<void>
  excluirResponsavel(id: string): Promise<void>
  catalogo: ModuloDoCatalogo
}
