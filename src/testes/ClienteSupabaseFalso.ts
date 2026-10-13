export type RespostaDoBanco = { data: unknown; error: { message: string; code?: string } | null }
type Ordenacao = [string, boolean] | [string, boolean, boolean]
export type Pedido = {
  tabela: string; operacao: string; colunas?: string; valores?: unknown; filtro?: [string, string]
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
      select: (colunas?: string) => {
        pedido.colunas ??= colunas
        return consulta
      },
      order: (coluna: string, opcoes?: { ascending?: boolean; nullsFirst?: boolean }) =>
        (pedido.ordem ??= []).push(ordenacao(coluna, opcoes)) && consulta,
      insert: (valores: unknown) => Object.assign(pedido, { operacao: 'insert', valores }) && consulta,
      update: (valores: unknown) => Object.assign(pedido, { operacao: 'update', valores }) && consulta,
      delete: () => Object.assign(pedido, { operacao: 'delete' }) && consulta,
      eq: (coluna: string, valor: string) => Object.assign(pedido, { filtro: [coluna, valor] }) && consulta,
      then: (seCumprir: (r: RespostaDoBanco) => unknown, seFalhar?: (e: unknown) => unknown) =>
        Promise.resolve(resposta()).then(seCumprir, seFalhar),
    }
    return consulta
  }
}

// Só guarda "nulos primeiro ou depois" quando o módulo pediu, para as ordens simples continuarem com dois itens.
function ordenacao(coluna: string, opcoes?: { ascending?: boolean; nullsFirst?: boolean }): Ordenacao {
  const ascendente = opcoes?.ascending ?? true
  return opcoes?.nullsFirst === undefined ? [coluna, ascendente] : [coluna, ascendente, opcoes.nullsFirst]
}
