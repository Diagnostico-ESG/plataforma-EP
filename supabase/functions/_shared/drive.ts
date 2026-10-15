// Auxiliares puros da conversa com o Drive e com o navegador, testados no Vitest.

const TIPO_PASTA = 'application/vnd.google-apps.folder'
// Conta de serviço não tem cota própria: no Drive compartilhado, estes são os motivos de "sem espaço".
const MOTIVOS_DE_COTA = ['storageQuotaExceeded', 'teamDriveFileLimitExceeded']

// Na linguagem de busca do Drive, aspas simples e barras invertidas do valor precisam de escape.
function escaparNaBusca(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function consultaDePastaPorNome(nome: string, paiId: string): string {
  return `name = '${escaparNaBusca(nome)}' and '${escaparNaBusca(paiId)}' in parents and mimeType = '${TIPO_PASTA}' and trashed = false`
}

function motivosDoErro(corpo: unknown): unknown[] {
  if (typeof corpo !== 'object' || corpo === null) return []
  const erro = (corpo as { error?: { errors?: unknown } }).error
  return Array.isArray(erro?.errors) ? erro.errors : []
}

export function eErroDeCota(corpo: unknown): boolean {
  return motivosDoErro(corpo).some((item) => {
    const motivo = (item as { reason?: unknown } | null)?.reason
    return typeof motivo === 'string' && MOTIVOS_DE_COTA.includes(motivo)
  })
}

export function origemAceita(origem: string | null, aceitas: string): boolean {
  if (!origem) return false
  return aceitas.split(',').map((item) => item.trim()).filter(Boolean).includes(origem)
}

export function cabecalhosDeOrigem(origem: string | null, aceitas: string): Record<string, string> {
  const comuns: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (!origem || !origemAceita(origem, aceitas)) return comuns
  return { ...comuns, 'Access-Control-Allow-Origin': origem }
}
