// A conta de serviço enxerga mais do que a pasta do ambiente (o Drive de produção, por exemplo), e o drive_id de cada
// arquivo e pasta é gravado pelo banco por quem tem perfil de escrita. Antes de ler, copiar, substituir ou mover algo
// pelo identificador guardado, a função confere que o item está debaixo da raiz do ambiente (segredo da função, fora do
// alcance de quem escreve no banco). Pura e sem Deno, testada no Vitest; quem fala com o Drive injeta `lerPais`.

/** Os pais de um item do Drive; null quando o Drive não o acha. */
export type LerPais = (id: string) => Promise<string[] | null>

// Arquivo -> pasta do processo -> pasta do setor -> raiz: do pai do arquivo, só mais dois níveis.
const NIVEIS_ACIMA_DO_PAI = 2

/** `pais` são os pais do item. Verdadeiro se algum deles é a raiz ou chega nela em até dois níveis. */
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
