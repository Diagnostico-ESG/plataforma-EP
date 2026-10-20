// As portas reais da decisão (_shared/planilhasPedido.ts): o Google Sheets e o banco. Cada chamada pega o token na hora
// (guardado em memória por google.ts).
import type { Portas } from '../_shared/planilhasPedido.ts'
import { registrarNoBanco } from './banco.ts'
import type { Configuracao } from './configuracao.ts'
import { obterToken } from './google.ts'
import { aplicarLoteNoSheets, lerAbasDoSheets } from './sheets.ts'

export function portasReais(config: Configuracao): Portas {
  return {
    lerAbas: async (planilha, id) => await lerAbasDoSheets(await obterToken(config), id, planilha),
    aplicarLote: async (planilha, id, lote) => await aplicarLoteNoSheets(await obterToken(config), id, lote, planilha),
    registrar: async (tentativa, ficha, deuCerto, motivo) =>
      await registrarNoBanco(config, tentativa, ficha, deuCerto, motivo),
    // Só o nome curto do aviso vai ao log: nunca dado do pedido.
    avisar: (tipo) => console.error(JSON.stringify({ funcao: 'planilhas-dos-dashboards', aviso: tipo })),
  }
}
