import type { EventoDoCadastro } from '../cadastros/tipos'
import type { PapelDoArquivo } from '../versoes/tipos'
import type { FaseDoRegimento } from './fasesDoRegimento'

export type StatusDaEtapa ='pendente' | 'em_andamento' | 'concluida' | 'realizada_anteriormente' | 'dispensada'

/** Uma etapa do catálogo num processo (o andamento): o id é o do andamento, que as ações recebem. */
export type EtapaDoCaminho = {
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

export type TipoDeProcesso = 'processo' | 'subprocesso' | 'a_classificar'
export type OrigemDoProcesso = 'novo' | 'retomado'
/**
 * A situação calculada: "concluido" não é guardado, vem de as etapas obrigatórias estarem resolvidas e de a escolha de
 * publicação ser "não" ou a Publicação estar resolvida.
 */
export type SituacaoDoProcesso = 'em_andamento' | 'suspenso' | 'cancelado' | 'concluido'

/** Uma etapa do catálogo, como as colunas do Quadro a usam. */
export type EtapaDoCatalogo = { id: string; codigo: string; nome: string; ordem: number; ativa: boolean }

/** Uma etapa do catálogo como a Administração a mostra: ativa ou não. */
export type EtapaNoCatalogo = EtapaDoCatalogo & { obrigatoria: boolean; fase: FaseDoRegimento | null }

/** O que o formulário de etapa nova grava; `antesDe` null põe a etapa no fim. */
export type EtapaNova = { codigo: string; nome: string; obrigatoria: boolean; fase: FaseDoRegimento; antesDe: string | null }

/** O que a edição muda: o código não muda depois de criado. */
export type DadosDaEtapa = { nome: string; obrigatoria: boolean; fase: FaseDoRegimento }

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

/** Uma etapa do caminho do processo como o cartão do Quadro a conta: só o código e o status. */
export type PedacoDoCaminho = { codigo: string; status: StatusDaEtapa }

/** O que o cartão do Quadro mostra além do resto do processo (parte 4); a view traz tudo pronto. */
export type DadosDoCartao = {
  etapaAtualStatus: 'pendente' | 'em_andamento' | null
  /** AAAA-MM-DD; null com a etapa atual pendente ou sem etapa atual. */
  etapaAtualIniciadaEm: string | null
  /** null sem responsável. */
  responsavelAtivo: boolean | null
  /** Na ordem do catálogo; vazio sem andamentos. */
  caminho: PedacoDoCaminho[]
  /** A versão de maior número, histórica ou não; null sem versão. */
  ultimaVersao: { numero: number; historica: boolean; temRelatorio: boolean } | null
  /** Os subprocessos que não foram cancelados. */
  subprocessos: number
}

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
  responsavel: ResponsavelDaEtapa | null
  /** A data da reunião de modelagem piloto (AAAA-MM-DD). Opcional para quem monta o processo à mão; o ProcessoLido a exige. */
  dataDaReuniao?: string | null
  /** Opcional pelo mesmo motivo: sem ele o cartão não tem barra nem selos. */
  cartao?: DadosDoCartao
  /** "Vai para publicação?" (ADR 0020): null sem resposta. Opcional pelo mesmo motivo. */
  vaiParaPublicacao?: boolean | null
  /** O dia em que a Publicação foi concluída (AAAA-MM-DD); null sem publicação. Opcional pelo mesmo motivo. */
  publicadoEm?: string | null
  /** Quando o processo concluído foi arquivado (data e hora); null fora do arquivo. Opcional pelo mesmo motivo. */
  arquivadoEm?: string | null
}

export type ListaDeProcessos = { etapas: EtapaDoCatalogo[]; processos: ProcessoDaLista[] }

/** A etapa do caminho com o nome de quem responde por ela. */
export type EtapaDoProcesso = EtapaDoCaminho & {
  responsavelId: string | null
  responsavelNome: string | null
  /** O responsável foi desativado depois de escolhido: aparece marcado e não se escolhe de novo. */
  responsavelInativo: boolean
}

/** As datas de uma etapa como o banco as guarda (AAAA-MM-DD); null onde a etapa não tem a data. */
export type DatasDaEtapa = { iniciadaEm: string | null; resolvidaEm: string | null }

/** Quem pode ser responsável por uma etapa: usuário ativo de perfil Administrador ou Integrante. */
export type UsuarioResponsavel = { id: string; nome: string }

/** As Anotações de um processo (texto livre, único, sem histórico; ADR 0021) e quem as alterou por último. */
export type AnotacoesLidas = { texto: string | null; alteradoPor: string | null; alteradoEm: string | null }

/** Gravado: o texto como o banco o guardou, com o novo autor e a hora. Conflito: o texto no banco já não era o esperado. */
export type ResultadoDaGravacaoDasAnotacoes = { tipo: 'gravado'; anotacoes: AnotacoesLidas } | { tipo: 'conflito' }

/** Um processo citado no painel de outro (o pai ou um subprocesso): abre o painel dele. */
/** O pai ou um subprocesso no verso: nome em link, a etapa atual e, fora de em andamento, a situação. */
export type ItemDaEstrutura = { id: string; nome: string; etapaAtual: string | null; situacao: SituacaoDoProcesso }

/**
 * A versão mais recente não histórica do processo, quem a enviou (esse autor não pode revisar o próprio trabalho) e os
 * papéis dos arquivos dela (a Validação com o setor só conclui com .bpm, .png e relatório).
 */
export type UltimaVersao = {
  numero: number; autorId: string; autorNome: string; papeis: PapelDoArquivo[]
  /** A não histórica de número imediatamente menor (a que a Revisão interna "corrigida" corrige); ausente sem anterior. */
  anterior?: { numero: number; autorId: string }
}

export type ProcessoLido = ProcessoDaLista & {
  origem: OrigemDoProcesso
  contexto: string | null
  observacoes: string | null
  motivoDaSituacao: string | null
  /** O pai do subprocesso; null nos outros tipos. */
  processoPai: ItemDaEstrutura | null
  /** Os subprocessos do processo, por nome. */
  subprocessos: ItemDaEstrutura[]
  etapasDoProcesso: EtapaDoProcesso[]
  /** A data da reunião de modelagem piloto (AAAA-MM-DD), passada ou futura; null quando não marcada. */
  dataDaReuniao: string | null
  /** Null sem versão não histórica: a Revisão interna não barra ninguém. */
  ultimaVersao: UltimaVersao | null
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
  /** Todos os processos por nome, mais as etapas do catálogo, na ordem dele. */
  listarProcessos(): Promise<ListaDeProcessos>
  /** null: o processo não existe (mais). */
  lerProcesso(id: string): Promise<ProcessoLido | null>
  /** Devolve o id do processo criado. */
  criarProcesso(dados: DadosDoProcesso): Promise<string>
  editarProcesso(id: string, dados: DadosDoProcesso): Promise<void>
  excluirProcesso(id: string): Promise<void>
  /** Marca, troca ou (com null) remove a data da reunião de modelagem piloto; vale em qualquer situação do processo. */
  marcarReuniao(id: string, data: string | null): Promise<void>
  /** null: o processo não existe (mais). Fora do ProcessoLido: o texto só o verso lê (ADR 0021). */
  lerAnotacoes(id: string): Promise<AnotacoesLidas | null>
  /**
   * Grava se o texto no banco ainda é `esperado` (o que a pessoa tinha ao começar a escrever; null: nenhum). Perfil e
   * processo arquivado chegam como TravaDoBanco; processo excluído, como CadastroInexistente; o conflito não é erro.
   */
  gravarAnotacoes(id: string, esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes>
  /** Do mais recente para o mais antigo. */
  lerHistoricoDoProcesso(id: string): Promise<EventoDoCadastro[]>
  iniciarEtapa(andamentoId: string): Promise<void>
  /**
   * Concluir, dispensar e registrar como realizada anteriormente resolvem a etapa atual e, se houver etapa pendente
   * depois dela, a iniciam com o responsável (null: ninguém), tudo ou nada; sem pendente depois, o responsável é ignorado.
   * Na Aprovação pelo setor com a Publicação pendente depois, a escolha de publicação é obrigatória ("não" pula a
   * Publicação); nas outras etapas ela é ignorada.
   */
  concluirEtapa(andamentoId: string, proximoResponsavelId: string | null, vaiParaPublicacao?: boolean | null): Promise<void>
  dispensarEtapa(andamentoId: string, nota: string, proximoResponsavelId: string | null): Promise<void>
  registrarRealizadaAnteriormente(
    andamentoId: string, nota: string, proximoResponsavelId: string | null, vaiParaPublicacao?: boolean | null,
  ): Promise<void>
  /** A etapa resolvida volta a em andamento, com o responsável (null: ninguém), e as seguintes a pendente; o motivo é obrigatório. */
  voltarParaEtapa(andamentoId: string, motivo: string, responsavelId: string | null): Promise<void>
  corrigirDatasDaEtapa(andamentoId: string, datas: DatasDaEtapa): Promise<void>
  /** null tira o responsável. */
  mudarResponsavelDaEtapa(andamentoId: string, usuarioId: string | null): Promise<void>
  /** Suspender, cancelar e retomar pedem motivo; com o processo parado, nenhuma etapa dele muda. */
  suspenderProcesso(id: string, motivo: string): Promise<void>
  cancelarProcesso(id: string, motivo: string): Promise<void>
  retomarProcesso(id: string, motivo: string): Promise<void>
  /** Com a Publicação em andamento e motivo: ela volta a pendente, a escolha vira "não" e o processo vai a Concluídos. */
  naoVaiMaisParaPublicacao(id: string, motivo: string): Promise<void>
  /**
   * No concluído não publicado (arquivado ou não): a Publicação fica concluída na data (AAAA-MM-DD), nem futura nem antes
   * da aprovação, e o processo fica onde está. A nota (null ou vazia: sem nota) vai só para o histórico.
   */
  registrarPublicacao(id: string, data: string, nota: string | null): Promise<void>
  /** Só o concluído não arquivado; o arquivado sai do Quadro e não aceita outra alteração além das duas abaixo. */
  arquivar(id: string): Promise<void>
  desarquivar(id: string): Promise<void>
  /** Muda o tipo com motivo, mantendo o mesmo item; ao virar subprocesso, ele passa ao macroprocesso do pai. */
  reclassificarProcesso(id: string, reclassificacao: Reclassificacao, motivo: string): Promise<void>
  /** Por nome. */
  listarResponsaveisPossiveis(): Promise<UsuarioResponsavel[]>
  catalogo: ModuloDoCatalogo
}
