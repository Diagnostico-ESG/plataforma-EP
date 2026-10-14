import { type ErroDoBanco, TravaDoBanco } from '../acesso/falhasDeGravacao'

// O banco recusa com "motivo:valor" (migração processos); o PostgREST pode acrescentar texto em volta.
// O mais longo vem primeiro: "setor_com_processos" também abre "setor_com_processos_no_macroprocesso".
const PADRAO_DA_RECUSA = /\b(setor_com_processos_no_macroprocesso|setor_com_processos|macroprocesso_com_processos):(.*)$/m

function processosLigados(quantidade: number): string {
  return quantidade === 1 ? '1 processo ligado' : `${quantidade} processos ligados`
}

function aoTirarDoMacroprocesso(valor: string): string {
  const [sigla, quantidade] = valor.split(':')
  if (Number(quantidade) === 1) return `O setor ${sigla} tem 1 processo neste macroprocesso; mova-o ou exclua-o antes.`
  return `O setor ${sigla} tem ${quantidade} processos neste macroprocesso; mova-os ou exclua-os antes.`
}

const FRASE_DA_RECUSA: Record<string, (valor: string) => string> = {
  setor_com_processos: (n) => `Não é possível excluir: setor tem ${processosLigados(Number(n))}.`,
  macroprocesso_com_processos: (n) => `Não é possível excluir: macroprocesso tem ${processosLigados(Number(n))}.`,
  setor_com_processos_no_macroprocesso: aoTirarDoMacroprocesso,
}

/** A recusa de apagar o que um processo usa, com a frase pronta da tela; null se o erro for outro. */
export function recusaDeProcessos(erro: ErroDoBanco): TravaDoBanco | null {
  const achado = erro.message.match(PADRAO_DA_RECUSA)
  if (!achado) return null
  return new TravaDoBanco(FRASE_DA_RECUSA[achado[1]](achado[2].trim()))
}
