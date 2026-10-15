import type { PapelDoArquivo, Versao } from './tipos'

/** Os papéis na ordem em que aparecem no formulário e na lista de arquivos. */
export const PAPEIS: readonly PapelDoArquivo[] = ['bpmn', 'png', 'bpm', 'relatorio']

export const ROTULO_DO_PAPEL: Record<PapelDoArquivo, string> = {
  bpmn: 'Fluxograma (.bpmn)',
  png: 'Imagem do fluxograma (.png)',
  bpm: 'Arquivo do Bizagi (.bpm)',
  relatorio: 'Relatório (.docx ou .pdf)',
}

/** O `accept` de cada campo de arquivo (o navegador só sugere; a conferência é que decide). */
export const ACCEPT_DO_PAPEL: Record<PapelDoArquivo, string> = {
  bpmn: '.bpmn', png: '.png,image/png', bpm: '.bpm', relatorio: '.docx,.pdf',
}

/** "V7" na versão nova, "V5F" na histórica. */
export function rotuloDaVersao({ numero, historica }: Pick<Versao, 'numero' | 'historica'>): string {
  return `V${numero}${historica ? 'F' : ''}`
}

/** O número que a versão nova vai receber: o maior do processo + 1, contando as históricas (o banco faz o mesmo). */
export function proximoNumero(versoes: Pick<Versao, 'numero'>[]): number {
  return Math.max(0, ...versoes.map((versao) => versao.numero)) + 1
}

/** Da mais recente (maior número) para a mais antiga. */
export function ordenarVersoes(versoes: Versao[]): Versao[] {
  return [...versoes].sort((a, b) => b.numero - a.numero)
}
