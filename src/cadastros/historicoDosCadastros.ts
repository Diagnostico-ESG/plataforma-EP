import { ROTULO_DO_STATUS, formatarData } from '../processos/caminhoDeEtapas'
import { ROTULO_DA_ORIGEM, ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from '../processos/rotulos'
import type { StatusDaEtapa } from '../processos/tipos'
import { rotuloDaCategoria } from './categorias'
import type { CategoriaDoMacroprocesso, EstadoDoCadastro, EventoDoCadastro, ItemDoFiltro } from './tipos'

const TEXTO_DA_ACAO: Record<string, string> = {
  criar: 'Criou', editar: 'Editou', desativar: 'Desativou', reativar: 'Reativou', excluir: 'Excluiu',
}

const TEXTO_DA_ACAO_DO_VINCULO: Record<string, string> = {
  criar: 'Pôs o setor no macroprocesso',
  excluir: 'Tirou o setor do macroprocesso',
  editar: 'Mudou a observação do setor no macroprocesso',
}

const TEXTO_DA_ACAO_DO_ANDAMENTO: Record<string, string> = {
  iniciar: 'Iniciou a etapa',
  concluir: 'Concluiu a etapa',
  dispensar: 'Dispensou a etapa',
  registrar_realizada: 'Registrou a etapa como realizada anteriormente',
  voltar: 'Voltou à etapa',
  corrigir_datas: 'Corrigiu as datas da etapa',
  mudar_responsavel: 'Mudou o responsável da etapa',
}

const TEXTO_DA_ACAO_DO_PROCESSO: Record<string, string> = {
  ...TEXTO_DA_ACAO, suspender: 'Suspendeu', cancelar: 'Cancelou', retomar: 'Retomou', reclassificar: 'Reclassificou',
}

// O texto livre do evento é nota (dispensar, realizada anteriormente) ou motivo (voltar, a situação do processo e a
// reclassificação).
const ACOES_COM_MOTIVO = new Set(['voltar', 'suspender', 'cancelar', 'retomar', 'reclassificar'])

export function rotuloDoMotivo(acao: string): string {
  return ACOES_COM_MOTIVO.has(acao) ? 'Motivo' : 'Nota'
}

const TEXTO_DA_ACAO_DA_ETAPA: Record<string, string> = {
  ...TEXTO_DA_ACAO, acrescentar: 'Acrescentou a etapa ao catálogo', mudar_ordem: 'Mudou a ordem do catálogo',
  desativar: 'Desativou a etapa', reativar: 'Reativou a etapa',
}

const TEXTO_DA_ACAO_DA_VERSAO: Record<string, string> = {
  enviar: 'Enviou a versão', registrar_historica: 'Registrou a versão histórica',
  acrescentar_relatorio: 'Acrescentou o relatório à versão', sem_alteracao: 'Marcou sem alteração de conteúdo na versão',
  substituir: 'Substituiu o arquivo da versão',
}

const TEXTOS_DA_ENTIDADE: Record<string, Record<string, string>> = {
  setor_envolvido: TEXTO_DA_ACAO_DO_VINCULO, andamento: TEXTO_DA_ACAO_DO_ANDAMENTO, processo: TEXTO_DA_ACAO_DO_PROCESSO,
  etapa: TEXTO_DA_ACAO_DA_ETAPA, versao: TEXTO_DA_ACAO_DA_VERSAO,
}

// Macroprocesso e etapa do catálogo aparecem como "código — nome".
const ENTIDADES_COM_CODIGO = new Set(['macroprocesso', 'etapa'])

// Vínculos, etapas e responsáveis do setor têm a referência 'idA:idB': o item do filtro sai dos ids gravados no evento.
const ENTIDADES_QUE_LIGAM = new Set(['setor_envolvido', 'andamento', 'responsavel_do_setor'])

const ROTULO_DO_CAMPO: Record<string, string> = {
  sigla: 'Sigla', nome: 'Nome', observacoes: 'Observações', ativo: 'Situação', codigo: 'Código', descricao: 'Descrição',
  categoria: 'Categoria', observacao: 'Observação', setor_sigla: 'Setor', macroprocesso_nome: 'Macroprocesso',
  macroprocessos: 'Macroprocessos', setores: 'Setores', status: 'Situação da etapa', iniciada_em: 'Início',
  resolvida_em: 'Conclusão', email: 'E-mail', cargo: 'Cargo', responsaveis: 'Responsáveis',
  tipo: 'Tipo', origem: 'Origem', situacao: 'Situação', contexto: 'Contexto', andamentos: 'Etapas',
  processo_nome: 'Processo', responsavel_nome: 'Responsável', processo_pai_nome: 'Processo pai',
  nivel: 'Nível', obrigatoria: 'Obrigatória', ativa: 'Situação', ordem: 'Posição',
  data_da_reuniao: 'Reunião de modelagem piloto',
  rotulo: 'Versão', etapa: 'Etapa', arquivos: 'Arquivos', relatorio_de: 'Relatório copiado da versão',
  hash_md5: 'Impressão digital (MD5)',
}

// Os ids existem para o filtro; quem lê o histórico vê a sigla e o nome. Código e nome da etapa já estão no título.
const CAMPOS_ESCONDIDOS = new Set(['setor_id', 'processo_id', 'macroprocesso_id', 'etapa_codigo', 'etapa_nome'])

// Ação desconhecida (de uma funcionalidade futura) aparece pelo código: sumir do histórico é pior que texto cru.
export function textoDaAcaoDoCadastro(acao: string, entidade: string): string {
  const textos = TEXTOS_DA_ENTIDADE[entidade] ?? TEXTO_DA_ACAO
  return textos[acao] ?? acao
}

function texto(valor: unknown): string {
  return typeof valor === 'string' && valor !== '' ? valor : '—'
}

function registro(valor: unknown): Record<string, unknown> {
  return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : {}
}

// O item é o que o evento deixou: o depois, ou o antes quando foi excluído.
function estadoLegivel(evento: EventoDoCadastro): Record<string, unknown> {
  return registro(evento.depois ?? evento.antes)
}

function codigoENome(codigo: unknown, nome: unknown): string {
  return typeof codigo === 'string' && codigo !== '' ? `${codigo} — ${texto(nome)}` : texto(nome)
}

/** A área Reuniões saiu da plataforma (ADR 0013); os eventos dela ficam no histórico, numa linha sem o detalhe. */
export const TEXTO_DA_REUNIAO_RETIRADA = 'Registro de reunião (recurso retirado da plataforma)'

// Etapa e responsável pertencem a um setor (a etapa, também a um processo): o nome vem com o dono; a versão vem com o
// processo dela; a reunião antiga é a linha simples; null se o item não for de nenhum deles.
function nomeDoItemComDono(entidade: string, estado: Record<string, unknown>): string | null {
  if (entidade === 'reuniao') return TEXTO_DA_REUNIAO_RETIRADA
  if (entidade === 'versao') return `${texto(estado.rotulo)} — ${texto(estado.processo_nome)}`
  const nomes: Record<string, unknown> = { andamento: estado.etapa_nome, responsavel_do_setor: estado.nome }
  const nome = nomes[entidade]
  if (typeof nome !== 'string') return null
  return `${nome} — ${texto(estado.processo_nome ?? estado.setor_sigla)}`
}

export function nomeDoItem(evento: EventoDoCadastro): string {
  const estado = estadoLegivel(evento)
  if (evento.entidade === 'setor' && typeof estado.sigla === 'string') return `${estado.sigla} — ${texto(estado.nome)}`
  if (ENTIDADES_COM_CODIGO.has(evento.entidade) && typeof estado.nome === 'string') return codigoENome(estado.codigo, estado.nome)
  if (evento.entidade === 'processo' && typeof estado.nome === 'string') return `${texto(estado.setor_sigla)} — ${estado.nome}`
  const comDono = nomeDoItemComDono(evento.entidade, estado)
  if (comDono !== null) return comDono
  if (typeof estado.setor_sigla === 'string' && typeof estado.macroprocesso_nome === 'string') {
    return `${estado.setor_sigla} em ${estado.macroprocesso_nome}`
  }
  return evento.entidadeRef
}

// Um item das listas da exclusão: macroprocesso (código) ou setor (sigla), com a observação do papel.
function itemDaLista(item: unknown): string {
  const { codigo, sigla, nome, observacao, etapa_nome: etapa, status } = registro(item)
  if (typeof etapa === 'string') return `${etapa} (${ROTULO_DO_STATUS[status as StatusDaEtapa] ?? texto(status)})`
  const nomeCompleto = codigoENome(codigo ?? sigla, nome)
  return typeof observacao === 'string' && observacao !== '' ? `${nomeCompleto} (${observacao})` : nomeCompleto
}

// As datas do andamento e a da reunião do processo aparecem em DD/MM/AAAA.
const CAMPOS_DE_DATA = new Set(['iniciada_em', 'resolvida_em', 'data_da_reuniao'])

// Campos do andamento (status pelo rótulo da tela) e as datas; null se não for deles.
function valorDaEtapa(campo: string, valor: unknown): string | null {
  if (campo === 'status') return ROTULO_DO_STATUS[valor as StatusDaEtapa] ?? texto(valor)
  if (CAMPOS_DE_DATA.has(campo)) return formatarData(typeof valor === 'string' ? valor : null)
  return null
}

// Campos do processo (tipo, origem, situação) e da etapa do catálogo (nível, obrigatória, ativa) pelo rótulo da tela;
// null se não for deles.
function valorPorRotulo(campo: string, valor: unknown): string | null {
  const rotulos: Record<string, Record<string, string>> = {
    tipo: ROTULO_DO_TIPO, origem: ROTULO_DA_ORIGEM, situacao: ROTULO_DA_SITUACAO,
    nivel: { setor: 'Setor', processo: 'Processo' }, obrigatoria: { true: 'Sim', false: 'Não' },
    ativa: { true: 'Ativa', false: 'Inativa' },
  }
  const rotulosDoCampo = rotulos[campo]
  return rotulosDoCampo ? (rotulosDoCampo[String(valor)] ?? texto(valor)) : null
}

function valorLegivel(campo: string, valor: unknown): string {
  if (campo === 'ativo') return valor ? 'Ativo' : 'Inativo'
  if (campo === 'categoria') return rotuloDaCategoria(valor as CategoriaDoMacroprocesso | null)
  const daEtapa = valorDaEtapa(campo, valor) ?? valorPorRotulo(campo, valor)
  if (daEtapa !== null) return daEtapa
  if (typeof valor === 'number') return String(valor) // a posição da etapa no catálogo
  if (!Array.isArray(valor)) return texto(valor)
  return valor.length === 0 ? 'nenhum' : valor.map(itemDaLista).join(', ')
}

export function descreverEstadoDoCadastro(estado: EstadoDoCadastro): string {
  if (estado === null) return '—'
  return Object.entries(estado)
    .filter(([campo]) => !CAMPOS_ESCONDIDOS.has(campo))
    .map(([campo, valor]) => `${ROTULO_DO_CAMPO[campo] ?? campo}: ${valorLegivel(campo, valor)}`)
    .join('; ')
}

// Evento de vínculo cita o setor e o macroprocesso: serve de nome quando nenhum evento próprio nomeou o item.
function itensDoVinculo(evento: EventoDoCadastro): [string, string][] {
  if (!ENTIDADES_QUE_LIGAM.has(evento.entidade)) return []
  const estado = estadoLegivel(evento)
  const pares: [unknown, unknown][] = [
    [estado.setor_id, estado.setor_sigla], [estado.macroprocesso_id, estado.macroprocesso_nome],
  ]
  return pares.filter((par): par is [string, string] => typeof par[0] === 'string' && typeof par[1] === 'string')
}

// Vínculos entram pelos ids que citam; reuniões antigas ficam fora, porque todas teriam o mesmo nome no filtro.
function temItemProprio(evento: EventoDoCadastro): boolean {
  return !ENTIDADES_QUE_LIGAM.has(evento.entidade) && evento.entidade !== 'reuniao'
}

/** Eventos da mais recente para a mais antiga: a primeira ocorrência de cada item dá o nome dele. */
export function itensDoFiltro(eventos: EventoDoCadastro[]): ItemDoFiltro[] {
  const nomes = new Map<string, string>()
  for (const evento of eventos.filter(temItemProprio)) {
    if (!nomes.has(evento.entidadeRef)) nomes.set(evento.entidadeRef, nomeDoItem(evento))
  }
  for (const par of eventos.flatMap(itensDoVinculo)) if (!nomes.has(par[0])) nomes.set(par[0], par[1])
  return [...nomes].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

// A referência do vínculo é 'macroprocessoId:setorId': o evento entra no filtro dos dois itens.
export function eventosDoItem(eventos: EventoDoCadastro[], itemId: string | null): EventoDoCadastro[] {
  if (itemId === null) return eventos
  return eventos.filter((evento) => evento.entidadeRef.split(':').includes(itemId))
}
