import { formatarData } from '../lib/datas'
import { ROTULO_DA_ETIQUETA, ROTULO_DA_ORIGEM, ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from '../processos/rotulos'
import { ROTULO_DO_ESCOPO } from '../revisoes/frasesDeRevisao'
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

// A passagem é o movimento do processo entre etapas e a etiqueta da etapa atual (Andamento livre).
const TEXTO_DA_ACAO_DA_PASSAGEM: Record<string, string> = { mover: 'Moveu o processo', mudar_etiqueta: 'Mudou a etiqueta' }

const TEXTO_DA_ACAO_DO_PROCESSO: Record<string, string> = {
  ...TEXTO_DA_ACAO, suspender: 'Suspendeu', cancelar: 'Cancelou', retomar: 'Retomou', reclassificar: 'Reclassificou',
  mudar_responsavel: 'Mudou o responsável',
  arquivar: 'Arquivou o processo',
  desarquivar: 'Desarquivou o processo',
  registrar_publicacao: 'Registrou a publicação',
  corrigir_publicacao: 'Corrigiu a publicação',
  registrar_data_da_validacao: 'Registrou a data da validação',
  alterar_data_da_validacao: 'Alterou a data da validação',
}

// O texto livre do evento é motivo (a situação do processo e a reclassificação) ou nota (o resto).
const ACOES_COM_MOTIVO = new Set(['suspender', 'cancelar', 'retomar', 'reclassificar'])

export function rotuloDoMotivo(acao: string): string {
  return ACOES_COM_MOTIVO.has(acao) ? 'Motivo' : 'Nota'
}

const TEXTO_DA_ACAO_DA_ETAPA: Record<string, string> = {
  ...TEXTO_DA_ACAO, acrescentar: 'Acrescentou a etapa ao catálogo', mudar_ordem: 'Mudou a ordem do catálogo',
  desativar: 'Desativou a etapa', reativar: 'Reativou a etapa',
}

const TEXTO_DA_ACAO_DA_VERSAO: Record<string, string> = {
  enviar: 'Enviou a versão', enviar_piloto: 'Enviou a versão piloto', registrar_historica: 'Registrou a versão histórica',
  acrescentar_arquivo: 'Acrescentou um arquivo à versão',
  enviar_relatorio: 'Enviou o Relatório',
  acrescentar_relatorio: 'Acrescentou o relatório à versão', sem_alteracao: 'Marcou sem alteração de conteúdo na versão',
  substituir: 'Substituiu o arquivo da versão',
}

const TEXTO_DA_ACAO_DO_ANEXO: Record<string, string> = { enviar: 'Enviou o anexo' }

const TEXTO_DA_ACAO_DA_REVISAO: Record<string, string> = { registrar: 'Registrou a revisão', editar: 'Editou a revisão' }

const TEXTO_DA_ACAO_DA_APROVACAO: Record<string, string> = {
  registrar: 'Registrou a aprovação', substituir: 'Substituiu a aprovação', desfazer: 'Desfez a aprovação', editar: 'Editou a aprovação',
  enviar_pdf: 'Enviou o .pdf da aprovação', substituir_pdf: 'Substituiu o .pdf da aprovação',
}

const TEXTOS_DA_ENTIDADE: Record<string, Record<string, string>> = {
  setor_envolvido: TEXTO_DA_ACAO_DO_VINCULO, passagem: TEXTO_DA_ACAO_DA_PASSAGEM, processo: TEXTO_DA_ACAO_DO_PROCESSO,
  etapa: TEXTO_DA_ACAO_DA_ETAPA, versao: TEXTO_DA_ACAO_DA_VERSAO, revisao_interna: TEXTO_DA_ACAO_DA_REVISAO,
  aprovacao: TEXTO_DA_ACAO_DA_APROVACAO, anexo: TEXTO_DA_ACAO_DO_ANEXO,
}

// Macroprocesso e etapa do catálogo aparecem como "código — nome".
const ENTIDADES_COM_CODIGO = new Set(['macroprocesso', 'etapa'])

// Vínculos têm a referência 'idA:idB': o item do filtro sai dos ids gravados no evento.
const ENTIDADES_QUE_LIGAM = new Set(['setor_envolvido'])

const ROTULO_DO_CAMPO: Record<string, string> = {
  sigla: 'Sigla', nome: 'Nome', observacoes: 'Observações', ativo: 'Situação', codigo: 'Código', descricao: 'Descrição',
  categoria: 'Categoria', observacao: 'Observação', setor_sigla: 'Setor', macroprocesso_nome: 'Macroprocesso',
  macroprocessos: 'Macroprocessos', setores: 'Setores', responsaveis: 'Responsáveis',
  tipo: 'Tipo', origem: 'Origem', situacao: 'Situação', contexto: 'Contexto',
  processo_nome: 'Processo', responsavel_nome: 'Responsável', processo_pai_nome: 'Processo pai', etiqueta: 'Etiqueta',
  nivel: 'Nível', obrigatoria: 'Obrigatória', fase: 'Fase', ativa: 'Situação', ordem: 'Posição',
  data_da_modelagem_piloto: 'Data da modelagem piloto', data_da_reuniao: 'Data da modelagem piloto',
  data_da_validacao: 'Data da validação', pdf_nome: '.pdf da aprovação',
  rotulo: 'Versão', etapa: 'Etapa', arquivos: 'Arquivos', relatorio_de: 'Relatório copiado da versão', papel: 'Arquivo acrescentado', numero_do_relatorio: 'Número do relatório',
  hash_md5: 'Impressão digital (MD5)', formato: 'Formato',
  versao_revisada: 'Versão revisada', versao_corrigida: 'Versão corrigida', resultado: 'Resultado', escopo: 'Escopo',
  comentario: 'Comentário', revisor_nome: 'Revisor', revisada_em: 'Data da revisão',
  versao: 'Versão aprovada', numero_eprotocolo: 'Número do E-protocolo', link: 'Link', aprovada_em: 'Data da aprovação',
  registrada_por_nome: 'Registrada por', publicado_em: 'Data da publicação', link_da_publicacao: 'Link da publicação',
  explicacao_sem_publicacao: 'Explicação de concluir sem publicação',
}

// Os ids existem para o filtro; quem lê o histórico vê a sigla e o nome. Código e nome da etapa já estão no título.
const CAMPOS_ESCONDIDOS = new Set(['setor_id', 'processo_id', 'macroprocesso_id', 'etapa_codigo', 'etapa_nome', 'responsavel_id', 'pdf_id'])

/** O texto do evento no histórico: o da ação e, no arquivo acrescentado à versão, qual arquivo foi ("Acrescentou o .png à versão"). */
export function textoDoEvento(evento: EventoDoCadastro): string {
  const proprio = evento.entidade === 'anexo' ? textoDoAnexo(evento) : textoDaVersao(evento)
  return proprio ?? textoDaAcaoDoCadastro(evento.acao, evento.entidade)
}

// "Enviou o anexo 'resposta.eml' (Modelagem piloto)": o nome e a etapa do envio, guardados no evento.
function textoDoAnexo(evento: EventoDoCadastro): string | null {
  if (evento.acao !== 'enviar') return null
  const { nome, etapa } = registro(evento.depois)
  if (typeof nome !== 'string') return null
  return `Enviou o anexo '${nome}'${typeof etapa === 'string' && etapa !== '' ? ` (${etapa})` : ''}`
}

function textoDaVersao(evento: EventoDoCadastro): string | null {
  if (evento.entidade !== 'versao') return null
  if (evento.acao === 'acrescentar_arquivo') {
    const papel = registro(evento.depois).papel
    if (typeof papel === 'string' && papel !== '') return `Acrescentou o .${papel} à versão`
  }
  if (evento.acao === 'enviar_relatorio') {
    const { numero_do_relatorio: numero, rotulo } = registro(evento.depois)
    if (typeof numero === 'number' && typeof rotulo === 'string') return `Enviou o Relatório V${numero} (acompanha a ${rotulo})`
  }
  return null
}

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

/**
 * O que o histórico escreve em negrito: o texto da ação e, no movimento do processo, de onde e para onde ele foi
 * ("Moveu de Revisão interna para Publicação").
 */
export function tituloDoEvento(evento: EventoDoCadastro): string {
  if (evento.entidade === 'passagem' && evento.acao === 'mover') {
    if (registro(evento.depois).explicacao_sem_publicacao !== undefined) return 'Concluiu sem publicação'
    return `Moveu de ${texto(registro(evento.antes).etapa_nome)} para ${texto(registro(evento.depois).etapa_nome)}`
  }
  return textoDaAcaoDoCadastro(evento.acao, evento.entidade)
}

function codigoENome(codigo: unknown, nome: unknown): string {
  return typeof codigo === 'string' && codigo !== '' ? `${codigo} — ${texto(nome)}` : texto(nome)
}

/** Recursos que saíram da plataforma (ADR 0013): os eventos ficam no histórico, numa linha sem o detalhe. */
const TEXTO_DO_RECURSO_RETIRADO: Record<string, string> = {
  reuniao: 'Registro de reunião (recurso retirado da plataforma)',
  responsavel_do_setor: 'Registro de responsável do setor (recurso retirado da plataforma)',
}

export function ehRegistroRetirado(evento: EventoDoCadastro): boolean {
  return evento.entidade in TEXTO_DO_RECURSO_RETIRADO
}

// A versão pertence a um processo: o nome vem com ele; o movimento e a etiqueta (passagem) citam o processo; os registros
// retirados são a linha simples; null se o item não for de nenhum deles.
function nomeDoItemComDono(evento: EventoDoCadastro, estado: Record<string, unknown>): string | null {
  if (ehRegistroRetirado(evento)) return TEXTO_DO_RECURSO_RETIRADO[evento.entidade]
  if (evento.entidade === 'passagem') return texto(estado.processo_nome)
  if (evento.entidade === 'versao') return `${texto(estado.rotulo)} — ${texto(estado.processo_nome)}`
  if (evento.entidade === 'revisao_interna') return `${texto(estado.versao_revisada)} — ${texto(estado.processo_nome)}`
  if (evento.entidade === 'aprovacao') return `${texto(estado.versao)} — ${texto(estado.processo_nome)}`
  if (evento.entidade === 'anexo') return `Anexos — ${texto(estado.processo_nome)}`
  return null
}

export function nomeDoItem(evento: EventoDoCadastro): string {
  const estado = estadoLegivel(evento)
  if (evento.entidade === 'setor' && typeof estado.sigla === 'string') return `${estado.sigla} — ${texto(estado.nome)}`
  if (ENTIDADES_COM_CODIGO.has(evento.entidade) && typeof estado.nome === 'string') return codigoENome(estado.codigo, estado.nome)
  if (evento.entidade === 'processo' && typeof estado.nome === 'string') return `${texto(estado.setor_sigla)} — ${estado.nome}`
  const comDono = nomeDoItemComDono(evento, estado)
  if (comDono !== null) return comDono
  if (typeof estado.setor_sigla === 'string' && typeof estado.macroprocesso_nome === 'string') {
    return `${estado.setor_sigla} em ${estado.macroprocesso_nome}`
  }
  return evento.entidadeRef
}

// Um item das listas da exclusão: macroprocesso (código) ou setor (sigla), com a observação do papel.
function itemDaLista(item: unknown): string {
  const { codigo, sigla, nome, observacao } = registro(item)
  const nomeCompleto = codigoENome(codigo ?? sigla, nome)
  return typeof observacao === 'string' && observacao !== '' ? `${nomeCompleto} (${observacao})` : nomeCompleto
}

// As datas da modelagem piloto (e a chave antiga dela, dos eventos gravados antes da troca de nome), da revisão, da aprovação
// e da publicação aparecem em DD/MM/AAAA.
const CAMPOS_DE_DATA = new Set(['data_da_modelagem_piloto', 'data_da_reuniao', 'data_da_validacao', 'revisada_em', 'aprovada_em', 'publicado_em'])

// Campos do processo (tipo, origem, situação, etiqueta) e da etapa do catálogo (obrigatória, ativa; o nível só nos eventos
// antigos) pelo rótulo da tela; null se não for deles.
function valorPorRotulo(campo: string, valor: unknown): string | null {
  const rotulos: Record<string, Record<string, string>> = {
    tipo: ROTULO_DO_TIPO, origem: ROTULO_DA_ORIGEM, situacao: ROTULO_DA_SITUACAO, etiqueta: ROTULO_DA_ETIQUETA,
    nivel: { setor: 'Setor', processo: 'Processo' }, obrigatoria: { true: 'Sim', false: 'Não' },
    ativa: { true: 'Ativa', false: 'Inativa' },
    resultado: { sem_alteracao: 'Sem alteração', corrigida: 'Corrigida' }, escopo: ROTULO_DO_ESCOPO,
  }
  const rotulosDoCampo = rotulos[campo]
  return rotulosDoCampo ? (rotulosDoCampo[String(valor)] ?? texto(valor)) : null
}

function valorLegivel(campo: string, valor: unknown): string {
  if (campo === 'ativo') return valor ? 'Ativo' : 'Inativo'
  if (campo === 'categoria') return rotuloDaCategoria(valor as CategoriaDoMacroprocesso | null)
  if (CAMPOS_DE_DATA.has(campo)) return formatarData(typeof valor === 'string' ? valor : null)
  const porRotulo = valorPorRotulo(campo, valor)
  if (porRotulo !== null) return porRotulo
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

// Vínculos entram pelos ids que citam; recursos retirados ficam fora, porque todos teriam o mesmo nome no filtro.
function temItemProprio(evento: EventoDoCadastro): boolean {
  return !ENTIDADES_QUE_LIGAM.has(evento.entidade) && !ehRegistroRetirado(evento)
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
