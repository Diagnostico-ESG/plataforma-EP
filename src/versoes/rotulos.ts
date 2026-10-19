import type { ArquivoDaVersao, PapelDoArquivo, Versao } from './tipos'

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

/** A versão histórica só pode ser registrada enquanto o processo não tem versão nova (o banco impõe a regra). */
export function haVersaoNova(versoes: Pick<Versao, 'historica'>[]): boolean {
  return versoes.some((versao) => !versao.historica)
}

/** Da mais recente (maior número) para a mais antiga. */
export function ordenarVersoes(versoes: Versao[]): Versao[] {
  return [...versoes].sort((a, b) => b.numero - a.numero)
}

/** "Relatório pendente": versão nova sem o arquivo do relatório (calculado na tela, não guardado). */
export function relatorioPendente(versao: Pick<Versao, 'historica' | 'arquivos'>): boolean {
  return !versao.historica && !versao.arquivos.some((arquivo) => arquivo.papel === 'relatorio')
}

/** As versões com relatório pendente, da mais recente para a mais antiga (a primeira é a escolhida no formulário). */
export function versoesComRelatorioPendente(versoes: Versao[]): Versao[] {
  return ordenarVersoes(versoes).filter(relatorioPendente)
}

function relatorioDaVersao(versao: Versao): ArquivoDaVersao | undefined {
  return versao.arquivos.find((arquivo) => arquivo.papel === 'relatorio')
}

/** A versão imediatamente anterior: a de maior número menor que o da versão (o banco usa a mesma regra). */
function versaoAnterior(versao: Versao, versoes: Versao[]): Versao | undefined {
  return ordenarVersoes(versoes).find((outra) => outra.numero < versao.numero)
}

/** [Sem alteração de conteúdo]: versão pendente cuja versão anterior tem relatório para copiar. */
export function podeCopiarRelatorio(versao: Versao, versoes: Versao[]): boolean {
  if (!relatorioPendente(versao)) return false
  const anterior = versaoAnterior(versao, versoes)
  return anterior !== undefined && relatorioDaVersao(anterior) !== undefined
}

/** O rótulo da versão de onde veio o relatório copiado ("V4"); null se o arquivo não é cópia (ou a origem não está na lista). */
export function origemDoRelatorio(arquivo: ArquivoDaVersao, versoes: Versao[]): string | null {
  if (!arquivo.copiadoDe) return null
  const origem = versoes.find((versao) => versao.arquivos.some((outro) => outro.id === arquivo.copiadoDe))
  return origem ? rotuloDaVersao(origem) : null
}

/** O rótulo da versão imediatamente anterior ("V3"); null se a versão é a primeira. */
export function rotuloDaAnterior(versao: Versao, versoes: Versao[]): string | null {
  const anterior = versaoAnterior(versao, versoes)
  return anterior ? rotuloDaVersao(anterior) : null
}

const NOME_CURTO_DO_PAPEL: Record<PapelDoArquivo, string> = {
  bpmn: 'Fluxograma', png: 'Imagem', bpm: 'Bizagi', relatorio: 'Relatório',
}

/** "Fluxograma .bpmn", "Relatório .pdf": o botão do arquivo no destaque da versão. */
export function rotuloCurtoDoArquivo({ papel, formato }: Pick<ArquivoDaVersao, 'papel' | 'formato'>): string {
  return `${NOME_CURTO_DO_PAPEL[papel]} .${formato.toLowerCase()}`
}

const FORMATO_DO_DIA_E_MES = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })

/** "02/10": o dia do envio na linha de destaque, no mesmo fuso do momento completo. */
export function formatarDiaEMes(iso: string): string {
  return FORMATO_DO_DIA_E_MES.format(new Date(iso))
}
