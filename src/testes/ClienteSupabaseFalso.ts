export type RespostaDoBanco = { data: unknown; error: { message: string; code?: string } | null }
export type Pedido = {
  tabela: string; operacao: string; colunas?: string; valores?: unknown; filtro?: [string, string]
  ordem?: [string, boolean][]
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
      order: (coluna: string, opcoes?: { ascending?: boolean }) =>
        (pedido.ordem ??= []).push([coluna, opcoes?.ascending ?? true]) && consulta,
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
