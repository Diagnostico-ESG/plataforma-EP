export type RespostaDoBanco = { data: unknown; error: { message: string; code?: string } | null }
type Ordenacao = [string, boolean] | [string, boolean, boolean]
export type Pedido = {
  tabela: string; operacao: string; colunas?: string; valores?: unknown; filtro?: [string, string]
  /** Todos os `eq` em ordem; `filtro` guarda só o último. */
  filtros?: [string, string][]
  /** O filtro `in` (coluna e valores aceitos). */
  dentro?: [string, string[]]
  /** O filtro `like` (coluna e padrão). */
  parecido?: [string, string]
  ordem?: Ordenacao[]
}

/** Cliente Supabase falso para os testes de módulo: guarda cada pedido e responde por "tabela.operação". */
export class ClienteSupabaseFalso {
  respostas: Record<string, RespostaDoBanco> = {}
  pedidos: Pedido[] = []

  from(tabela: string) {
    const pedido: Pedido = { tabela, operacao: 'select' }
    this.pedidos.push(pedido)
    const resposta = () => this.respostas[`${tabela}.${pedido.operacao}`] ?? { data: [], error: null }
    const consulta = {
      select: (colunas?: string) => Object.assign(pedido, { colunas: pedido.colunas ?? colunas }) && consulta,
      order: (coluna: string, opcoes?: { ascending?: boolean; nullsFirst?: boolean }) =>
        (pedido.ordem ??= []).push(ordenacao(coluna, opcoes)) && consulta,
      insert: (valores: unknown) => Object.assign(pedido, { operacao: 'insert', valores }) && consulta,
      update: (valores: unknown) => Object.assign(pedido, { operacao: 'update', valores }) && consulta,
      delete: () => Object.assign(pedido, { operacao: 'delete' }) && consulta,
      eq: (coluna: string, valor: string) => guardarFiltro(pedido, coluna, valor) && consulta,
      in: (coluna: string, valores: string[]) => Object.assign(pedido, { dentro: [coluna, valores] }) && consulta,
      like: (coluna: string, padrao: string) => Object.assign(pedido, { parecido: [coluna, padrao] }) && consulta,
      then: (seCumprir: (r: RespostaDoBanco) => unknown, seFalhar?: (e: unknown) => unknown) =>
        Promise.resolve(resposta()).then(seCumprir, seFalhar),
    }
    return consulta
  }
}

function guardarFiltro(pedido: Pedido, coluna: string, valor: string): true {
  pedido.filtro = [coluna, valor]
  ;(pedido.filtros ??= []).push([coluna, valor])
  return true
}

// Só guarda "nulos primeiro ou depois" quando o módulo pediu, para as ordens simples continuarem com dois itens.
function ordenacao(coluna: string, opcoes?: { ascending?: boolean; nullsFirst?: boolean }): Ordenacao {
  const ascendente = opcoes?.ascending ?? true
  return opcoes?.nullsFirst === undefined ? [coluna, ascendente] : [coluna, ascendente, opcoes.nullsFirst]
}
