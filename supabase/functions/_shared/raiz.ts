// A conta de serviço enxerga mais do que a pasta do ambiente (o Drive de produção, por exemplo), e o drive_id de cada
// arquivo e pasta é gravado pelo banco por quem tem perfil de escrita. Antes de ler, copiar, substituir ou mover algo
// pelo identificador guardado, a função confere que o item está debaixo da raiz do ambiente (segredo da função, fora do
// alcance de quem escreve no banco). Pura e sem Deno, testada no Vitest; quem fala com o Drive injeta `lerPais`.

/** Os pais de um item do Drive; null quando o Drive não o acha. */
export type LerPais = (id: string) => Promise<string[] | null>

// Arquivo de versão: pasta do processo -> pasta do setor -> raiz. Anexo: subpasta "Anexos" -> pasta do processo -> pasta do setor -> raiz.
// Do pai do arquivo, o anexo precisa de três níveis acima; com dois, a prova no Drive real recusou todo anexo (2026-11-04).
const NIVEIS_ACIMA_DO_PAI = 3

/** `pais` são os pais do item. Verdadeiro se algum deles é a raiz ou chega nela em até três níveis. */
export async function estaSobARaiz(
  pais: string[], raizId: string, lerPais: LerPais, niveis: number = NIVEIS_ACIMA_DO_PAI,
): Promise<boolean> {
  if (pais.includes(raizId)) return true
  if (niveis === 0) return false
  for (const pai of pais) {
    const paisDoPai = await lerPais(pai)
    if (paisDoPai && (await estaSobARaiz(paisDoPai, raizId, lerPais, niveis - 1))) return true
  }
  return false
}

// miniatura-rapida (ADR 0038): a conferência sobe as pastas uma chamada ao Drive por nível, em todo pedido de arquivo. A função lembra,
// na memória da instância, as pastas que já confirmou debaixo da raiz. Só a resposta positiva é lembrada; recusa e falha nunca.
// Efeito aceito: pasta movida para fora da raiz continua valendo até a lembrança vencer (5 minutos), naquela instância.
const DURACAO_DA_LEMBRANCA_EM_MS = 5 * 60 * 1000

export interface MemoriaDePastas {
  confirmada: (pastaId: string) => boolean
  lembrar: (pastaId: string) => void
}

export function criarMemoriaDePastas(agora: () => number = Date.now): MemoriaDePastas {
  const venceEm = new Map<string, number>()
  return {
    confirmada: (pastaId) => (venceEm.get(pastaId) ?? 0) > agora(),
    lembrar: (pastaId) => {
      const hoje = agora()
      for (const [id, vence] of venceEm) if (vence <= hoje) venceEm.delete(id)
      venceEm.set(pastaId, hoje + DURACAO_DA_LEMBRANCA_EM_MS)
    },
  }
}

/** Como `estaSobARaiz`, mas pula a pasta já lembrada e lembra o pai que acabou de ser confirmado. */
export async function estaSobARaizComMemoria(
  pais: string[], raizId: string, lerPais: LerPais, memoria: MemoriaDePastas,
): Promise<boolean> {
  if (pais.includes(raizId) || pais.some(memoria.confirmada)) return true
  for (const pai of pais) {
    if (!(await estaSobARaiz([pai], raizId, lerPais))) continue
    memoria.lembrar(pai)
    return true
  }
  return false
}
