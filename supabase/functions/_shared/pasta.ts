// Decide o que fazer com uma pasta do Drive para ela acompanhar a sigla, o nome e o setor atuais do banco (ticket 08).
// Pura e sem Deno, testada no Vitest; quem fala com o Drive é arquivos-no-drive/pastas.ts.

export interface PastaNoDrive {
  nome: string
  pais: string[]
}

export interface PastaDesejada {
  nome: string
  paiId: string
}

export interface AjusteDaPasta {
  renomearPara: string | null
  mover: { paraPai: string; tirarDe: string[] } | null
}

export function decidirAjusteDaPasta(atual: PastaNoDrive, desejado: PastaDesejada): AjusteDaPasta {
  const renomearPara = atual.nome === desejado.nome ? null : desejado.nome
  const mover = atual.pais.includes(desejado.paiId) ? null : { paraPai: desejado.paiId, tirarDe: atual.pais }
  return { renomearPara, mover }
}
