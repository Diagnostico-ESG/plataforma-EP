import type { EventoDoCadastro } from '../cadastros/tipos'
import type { PapelDoArquivo } from '../versoes/tipos'
import type { FaseDoRegimento } from './fasesDoRegimento'

/** A etiqueta da etapa atual (Andamento livre): em Concluídos é sempre `concluido`. */
export type EtiquetaDaEtapa = 'a_fazer' | 'em_andamento' | 'concluido'

export type TipoDeProcesso = 'processo' | 'subprocesso' | 'a_classificar'
export type OrigemDoProcesso = 'novo' | 'retomado'
/** A situação calculada: "concluido" não é guardado, vem de a etapa atual ser Concluídos com o processo em andamento. */
export type SituacaoDoProcesso = 'em_andamento' | 'suspenso' | 'cancelado' | 'concluido'

/** Uma etapa do catálogo, como as colunas do Quadro a usam. */
export type EtapaDoCatalogo = { id: string; codigo: string; nome: string; ordem: number; ativa: boolean }

/** Uma etapa do catálogo como a Administração a mostra: ativa ou não. `fase` é nula só nas duas fixas. */
export type EtapaNoCatalogo = EtapaDoCatalogo & { fase: FaseDoRegimento | null }

/** O que o formulário de etapa nova grava; `antesDe` null põe a etapa logo antes de Concluídos. */
export type EtapaNova = { codigo: string; nome: string; fase: FaseDoRegimento; antesDe: string | null }

/** O que a edição muda: o código não muda depois de criado. */
export type DadosDaEtapa = { nome: string; fase: FaseDoRegimento }

export type SentidoDaOrdem = 'subir' | 'descer'

/** A manutenção do catálogo (só o administrador; a RLS decide). Recusas como no módulo de processos. */
export type ModuloDoCatalogo = {
  /** Todas as etapas, ativas e inativas, na ordem. */
  listarCatalogo(): Promise<EtapaNoCatalogo[]>
  acrescentarEtapa(etapa: EtapaNova): Promise<void>
  editarEtapa(id: string, dados: DadosDaEtapa): Promise<void>
  /** Troca com a vizinha, sem atravessar as fixas; na ponta, nada muda. */
  moverEtapa(id: string, sentido: SentidoDaOrdem): Promise<void>
  /** Recusada com processo dentro (a frase traz a contagem) e nas etapas fixas e protegidas. */
  desativarEtapa(id: string): Promise<void>
  /** Volta a ter coluna no Quadro, sem mexer em nenhum processo. */
  reativarEtapa(id: string): Promise<void>
  /** Só a etapa por onde nenhum processo passou. */
  excluirEtapa(id: string): Promise<void>
}

export type ResponsavelDoProcesso = { id: string; nome: string; fotoUrl: string | null }

/** O que o cartão do Quadro mostra além do resto do processo; a view traz tudo pronto. */
export type DadosDoCartao = {
  /** null sem responsável. */
  responsavelAtivo: boolean | null
  /** A versão de maior número, histórica ou não; null sem versão. */
  ultimaVersao: { numero: number; historica: boolean; temRelatorio: boolean } | null
  /** Os subprocessos que não foram cancelados. */
  subprocessos: number
}

/** O que o processo já tem de arquivos, lido da view: a trava de arquivos (ADR 0025) decide por isto. */
export type ArquivosDoProcesso = { versaoPiloto: boolean; versaoEmSequencia: boolean; relatorioNumerado: boolean }

/** A etapa atual do processo (a passagem aberta) e o lugar dela entre as etapas ativas do catálogo. */
export type EtapaAtual = { id: string; codigo: string; nome: string; ordem: number; posicao: number; total: number }

/** Um processo como o Quadro e a Lista o mostram: com a etapa atual, a etiqueta, o responsável do processo e a situação calculada. */
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
  etapaAtual: EtapaAtual | null
  /** A etiqueta da etapa atual; em Concluídos, sempre `concluido`. Opcional para quem monta o processo à mão: sem ela, A fazer. */
  etiqueta?: EtiquetaDaEtapa
  /** O dia em que o processo entrou na etapa atual (AAAA-MM-DD, dia de Brasília). Opcional como a etiqueta. */
  entrouNaEtapaEm?: string | null
  responsavel: ResponsavelDoProcesso | null
  /** A data da reunião de modelagem piloto (AAAA-MM-DD). Opcional para quem monta o processo à mão; o ProcessoLido a exige. */
  dataDaModelagemPiloto?: string | null
  /** O dia em que o setor validou o fluxo (AAAA-MM-DD, nunca futuro); null sem a data. Opcional pelo mesmo motivo. */
  dataDaValidacao?: string | null
  /** Opcional pelo mesmo motivo: sem ele o cartão não tem selos de versão nem de subprocessos. */
  cartao?: DadosDoCartao
  /** O que o processo tem de arquivos, para a trava de arquivos. Opcional pelo mesmo motivo: sem ele a tela não trava. */
  arquivos?: ArquivosDoProcesso
  /** O dia da publicação (AAAA-MM-DD); null sem a data. Opcional pelo mesmo motivo. */
  publicadoEm?: string | null
  /** O link da publicação (http ou https); null sem link. Opcional pelo mesmo motivo. */
  linkDaPublicacao?: string | null
  /** Por que o processo foi concluído sem publicação; null com a data da publicação ou fora de Concluídos. Opcional pelo mesmo motivo. */
  explicacaoSemPublicacao?: string | null
  /** Quando o processo concluído foi arquivado (data e hora); null fora do arquivo. Opcional pelo mesmo motivo. */
  arquivadoEm?: string | null
}

/** Um setor como o Quadro agrupado por setor o mostra: as colunas saem daqui, inclusive as vazias. */
export type SetorDoQuadro = { id: string; sigla: string; nome: string; ativo: boolean }

export type ListaDeProcessos = { etapas: EtapaDoCatalogo[]; processos: ProcessoDaLista[]; setores: SetorDoQuadro[] }

/** Quem pode ser responsável por um processo: usuário ativo de perfil Administrador ou Integrante. */
export type UsuarioResponsavel = { id: string; nome: string }

/** As Anotações de um processo (texto livre, único, sem histórico; ADR 0021) e quem as alterou por último. */
export type AnotacoesLidas = { texto: string | null; alteradoPor: string | null; alteradoEm: string | null }

/** Gravado: o texto como o banco o guardou, com o novo autor e a hora. Conflito: o texto no banco já não era o esperado. */
export type ResultadoDaGravacaoDasAnotacoes = { tipo: 'gravado'; anotacoes: AnotacoesLidas } | { tipo: 'conflito' }

/** O pai ou um subprocesso no verso: nome em link, a etapa atual e, fora de em andamento, a situação. */
export type ItemDaEstrutura = { id: string; nome: string; etapaAtual: string | null; situacao: SituacaoDoProcesso }

/**
 * A versão mais recente não histórica do processo, quem a enviou (esse autor não é o revisor ideal da Revisão interna) e os
 * papéis dos arquivos dela.
 */
export type UltimaVersao = {
  numero: number; autorId: string; autorNome: string; papeis: PapelDoArquivo[]
  /** A não histórica de número imediatamente menor (a que a Revisão interna "corrigida" corrige); ausente sem anterior. */
  anterior?: { numero: number; autorId: string }
  /** Verdadeiro quando esta versão foi enviada com o processo na Revisão interna, depois de ele entrar na passagem atual (a "corrigida" só vale então). */
  enviadaNestaPassagem?: boolean
}

/** Uma estadia do processo numa etapa (AAAA-MM-DD, dia de Brasília); `saiuEm` é null na passagem aberta. */
export type PassagemDaEtapa = { entrouEm: string; saiuEm: string | null }

/** Uma etapa ativa do catálogo como a seção Etapas do verso a mostra, com as passagens do processo por ela (a mais recente primeiro). */
export type EtapaDoVerso = { id: string; codigo: string; nome: string; ordem: number; passagens: PassagemDaEtapa[] }

export type ProcessoLido = ProcessoDaLista & {
  origem: OrigemDoProcesso
  contexto: string | null
  observacoes: string | null
  motivoDaSituacao: string | null
  /** O pai do subprocesso; null nos outros tipos. */
  processoPai: ItemDaEstrutura | null
  /** Os subprocessos do processo, por nome. */
  subprocessos: ItemDaEstrutura[]
  /** As etapas ativas, na ordem do catálogo. */
  etapasDoVerso: EtapaDoVerso[]
  /** A data da reunião de modelagem piloto (AAAA-MM-DD), passada ou futura; null quando não marcada. */
  dataDaModelagemPiloto: string | null
  /** Null sem versão não histórica. */
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
  /** Só no cadastro (AAAA-MM-DD; null ou ausente = sem data): depois dele a data se altera no verso. */
  dataDaModelagemPiloto?: string | null
}

/** O tipo novo de uma reclassificação; o pai só no subprocesso. Nada volta a "a classificar". */
export type Reclassificacao = { tipo: Exclude<TipoDeProcesso, 'a_classificar'>; processoPaiId: string | null }

/** Os dados da chegada a Concluídos: a data da publicação (com o link) ou a explicação de concluir sem publicação. */
export type DadosDaChegada = {
  dataDaPublicacao: string | null
  linkDaPublicacao: string | null
  explicacao: string | null
}

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
  /** Devolve o id do processo criado; o processo entra em Não iniciados, com A fazer e sem responsável. */
  criarProcesso(dados: DadosDoProcesso): Promise<string>
  editarProcesso(id: string, dados: DadosDoProcesso): Promise<void>
  excluirProcesso(id: string): Promise<void>
  /** Marca, troca ou (com null) remove a data da reunião de modelagem piloto; vale em qualquer situação do processo. */
  marcarDataDaModelagemPiloto(id: string, data: string | null): Promise<void>
  /** null: o processo não existe (mais). Fora do ProcessoLido: o texto só o verso lê (ADR 0021). */
  lerAnotacoes(id: string): Promise<AnotacoesLidas | null>
  /**
   * Grava se o texto no banco ainda é `esperado` (o que a pessoa tinha ao começar a escrever; null: nenhum). Perfil e
   * processo arquivado chegam como TravaDoBanco; processo excluído, como CadastroInexistente; o conflito não é erro.
   */
  gravarAnotacoes(id: string, esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes>
  /** Do mais recente para o mais antigo. */
  lerHistoricoDoProcesso(id: string): Promise<EventoDoCadastro[]>
  /**
   * Leva o processo a qualquer etapa ativa, sem motivo nem sequência; a etiqueta volta a A fazer e quem chama vira o
   * responsável. Para a mesma etapa, nada acontece. Para Concluídos, sem a data da publicação já registrada, o banco pede
   * os dados da chegada.
   */
  moverProcesso(id: string, etapaId: string, chegada?: DadosDaChegada): Promise<void>
  /** Muda a etiqueta da etapa atual; em Concluídos ela é fixa. */
  mudarEtiqueta(id: string, etiqueta: EtiquetaDaEtapa): Promise<void>
  /** Troca o responsável do processo; null tira o responsável. [Assumir] é mudar para si mesmo. */
  mudarResponsavel(id: string, usuarioId: string | null): Promise<void>
  /** Suspender, cancelar e retomar pedem motivo; com o processo parado, a etapa, a etiqueta e o responsável não mudam. */
  suspenderProcesso(id: string, motivo: string): Promise<void>
  cancelarProcesso(id: string, motivo: string): Promise<void>
  retomarProcesso(id: string, motivo: string): Promise<void>
  /** O concluído, o suspenso e o cancelado, não arquivados; o arquivado sai do Quadro e só aceita registrar a publicação e desarquivar. */
  arquivar(id: string): Promise<void>
  desarquivar(id: string): Promise<void>
  /**
   * Registra a data da publicação (com o link, se houver) ou, já registrada, a corrige; o processo fica onde está. Vale na
   * Publicação e em Concluídos; no arquivado, só sem data. A data não é futura nem anterior à aprovação.
   */
  registrarPublicacao(id: string, data: string, link: string | null): Promise<void>
  /** Muda o tipo com motivo, mantendo o mesmo item; ao virar subprocesso, ele passa ao macroprocesso do pai. */
  reclassificarProcesso(id: string, reclassificacao: Reclassificacao, motivo: string): Promise<void>
  /** Por nome. */
  listarResponsaveisPossiveis(): Promise<UsuarioResponsavel[]>
  catalogo: ModuloDoCatalogo
}
