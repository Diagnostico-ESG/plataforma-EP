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

const ROTULO_DO_CAMPO: Record<string, string> = {
  sigla: 'Sigla', nome: 'Nome', observacoes: 'Observações', ativo: 'Situação', codigo: 'Código', descricao: 'Descrição',
  categoria: 'Categoria', observacao: 'Observação', setor_sigla: 'Setor', macroprocesso_nome: 'Macroprocesso',
  macroprocessos: 'Macroprocessos', setores: 'Setores',
}

// Os ids existem para o filtro; quem lê o histórico vê a sigla e o nome.
const CAMPOS_ESCONDIDOS = new Set(['setor_id', 'macroprocesso_id'])

// Ação desconhecida (de uma funcionalidade futura) aparece pelo código: sumir do histórico é pior que texto cru.
export function textoDaAcaoDoCadastro(acao: string, entidade: string): string {
  const textos = entidade === 'setor_envolvido' ? TEXTO_DA_ACAO_DO_VINCULO : TEXTO_DA_ACAO
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

export function nomeDoItem(evento: EventoDoCadastro): string {
  const estado = estadoLegivel(evento)
  if (evento.entidade === 'setor' && typeof estado.sigla === 'string') return `${estado.sigla} — ${texto(estado.nome)}`
  if (evento.entidade === 'macroprocesso' && typeof estado.nome === 'string') return codigoENome(estado.codigo, estado.nome)
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

function valorLegivel(campo: string, valor: unknown): string {
  if (campo === 'ativo') return valor ? 'Ativo' : 'Inativo'
  if (campo === 'categoria') return rotuloDaCategoria(valor as CategoriaDoMacroprocesso | null)
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
  if (evento.entidade !== 'setor_envolvido') return []
  const estado = estadoLegivel(evento)
  const pares: [unknown, unknown][] = [
    [estado.setor_id, estado.setor_sigla], [estado.macroprocesso_id, estado.macroprocesso_nome],
  ]
  return pares.filter((par): par is [string, string] => typeof par[0] === 'string' && typeof par[1] === 'string')
}

/** Eventos da mais recente para a mais antiga: a primeira ocorrência de cada item dá o nome dele. */
export function itensDoFiltro(eventos: EventoDoCadastro[]): ItemDoFiltro[] {
  const nomes = new Map<string, string>()
  for (const evento of eventos) {
    if (evento.entidade !== 'setor_envolvido' && !nomes.has(evento.entidadeRef)) nomes.set(evento.entidadeRef, nomeDoItem(evento))
  }
  for (const par of eventos.flatMap(itensDoVinculo)) if (!nomes.has(par[0])) nomes.set(par[0], par[1])
  return [...nomes].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

// A referência do vínculo é 'macroprocessoId:setorId': o evento entra no filtro dos dois itens.
export function eventosDoItem(eventos: EventoDoCadastro[], itemId: string | null): EventoDoCadastro[] {
  if (itemId === null) return eventos
  return eventos.filter((evento) => evento.entidadeRef.split(':').includes(itemId))
}
