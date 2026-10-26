import {
  CODIGO_DA_MODELAGEM_PILOTO, CODIGO_DA_REVISAO_INTERNA, CODIGO_DA_TECNICA, CODIGO_NAO_INICIADOS,
} from '../processos/codigosDasEtapas'
import type { ArquivoDaVersao, PapelDoArquivo, Versao } from './tipos'

/** Os papéis na ordem do formulário: o .bpm, obrigatório, primeiro; o .png e o .bpmn opcionais; o relatório por último (ADR 0025). */
export const PAPEIS: readonly PapelDoArquivo[] = ['bpm', 'png', 'bpmn', 'relatorio']

/** A ordem dos arquivos da versão na tela: o .png primeiro, porque é o que se abre para ver o fluxo. */
const ORDEM_DOS_ARQUIVOS: readonly PapelDoArquivo[] = ['png', 'bpm', 'relatorio', 'bpmn']

export function emOrdemDeExibicao<T extends Pick<ArquivoDaVersao, 'papel'>>(arquivos: T[]): T[] {
  return [...arquivos].sort((a, b) => ORDEM_DOS_ARQUIVOS.indexOf(a.papel) - ORDEM_DOS_ARQUIVOS.indexOf(b.papel))
}

export const ROTULO_DO_PAPEL: Record<PapelDoArquivo, string> = {
  bpm: 'Fluxograma Bizagi (.bpm)',
  png: 'Imagem do fluxo (.png)',
  bpmn: '.bpmn',
  relatorio: 'Relatório (.docx)',
  pdf_da_aprovacao: '.pdf protocolado',
}

/** O `accept` de cada campo de arquivo (o navegador só sugere; a conferência é que decide). */
export const ACCEPT_DO_PAPEL: Record<PapelDoArquivo, string> = {
  bpmn: '.bpmn', png: '.png,image/png', bpm: '.bpm', relatorio: '.docx', pdf_da_aprovacao: '.pdf,application/pdf',
}

/** O relatório da histórica, que não é numerado, ainda aceita o .pdf; nos demais envios o relatório é só .docx (ADR 0026). */
export function acceptDoCampo(papel: PapelDoArquivo, historica: boolean): string {
  return papel === 'relatorio' && historica ? '.docx,.pdf' : ACCEPT_DO_PAPEL[papel]
}

export function rotuloDoCampo(papel: PapelDoArquivo, historica: boolean): string {
  return papel === 'relatorio' && historica ? 'Relatório (.docx ou .pdf)' : ROTULO_DO_PAPEL[papel]
}

/** "V7" na versão em sequência, "V5F" na histórica, "V6P" na piloto. */
export function rotuloDaVersao({ numero, historica, piloto }: Pick<Versao, 'numero' | 'historica'> & { piloto?: boolean }): string {
  return `V${numero}${historica ? 'F' : piloto ? 'P' : ''}`
}

/** O número que a versão nova vai receber: o maior do processo + 1, contando as históricas (o banco faz o mesmo). */
export function proximoNumero(versoes: Pick<Versao, 'numero'>[]): number {
  return Math.max(0, ...versoes.map((versao) => versao.numero)) + 1
}

/** A versão histórica só pode ser registrada enquanto o processo não tem versão piloto nem em sequência (o banco impõe a regra). */
export function haVersaoNova(versoes: Pick<Versao, 'historica'>[]): boolean {
  return versoes.some((versao) => !versao.historica)
}

/** A versão piloto só pode ser enviada enquanto o processo não tem versão em sequência (o banco impõe a regra). */
export function haVersaoEmSequencia(versoes: Pick<Versao, 'historica' | 'piloto'>[]): boolean {
  return versoes.some((versao) => !versao.historica && !versao.piloto)
}

export type EnvioDaEtapa = 'historica' | 'piloto' | 'sequencia'

/**
 * O único envio de versão que o verso oferece na etapa atual (ADR 0025): a histórica em Não iniciados, a piloto na Modelagem
 * piloto, a em sequência na técnica e na Revisão interna; nenhum nas outras etapas, nem nas do catálogo que forem acrescentadas.
 */
export function envioDaEtapa(codigoDaEtapa: string, versoes: Pick<Versao, 'historica' | 'piloto'>[]): EnvioDaEtapa | null {
  if (codigoDaEtapa === CODIGO_NAO_INICIADOS) return haVersaoNova(versoes) ? null : 'historica'
  if (codigoDaEtapa === CODIGO_DA_MODELAGEM_PILOTO) return haVersaoEmSequencia(versoes) ? null : 'piloto'
  if (codigoDaEtapa === CODIGO_DA_TECNICA || codigoDaEtapa === CODIGO_DA_REVISAO_INTERNA) return 'sequencia'
  return null
}

/** O [Enviar relatório] aparece na técnica e na Revisão interna, quando há versão piloto ou em sequência para recebê-lo (ADR 0026). */
export function podeEnviarRelatorioNaEtapa(codigoDaEtapa: string, versoes: Pick<Versao, 'historica'>[]): boolean {
  return (codigoDaEtapa === CODIGO_DA_TECNICA || codigoDaEtapa === CODIGO_DA_REVISAO_INTERNA) && versoes.some((versao) => !versao.historica)
}

/** O .png e o .bpmn que ainda se pode acrescentar: só na versão piloto ou em sequência, fora da aprovada, e só o que falta. */
export function papeisQueSePodeAcrescentar(versao: Pick<Versao, 'historica' | 'aprovada' | 'arquivos'>): ('png' | 'bpmn')[] {
  if (versao.historica || versao.aprovada) return []
  const tem = (papel: PapelDoArquivo) => versao.arquivos.some((arquivo) => arquivo.papel === papel)
  return (['png', 'bpmn'] as const).filter((papel) => !tem(papel))
}

/** Da mais recente (maior número) para a mais antiga. */
export function ordenarVersoes(versoes: Versao[]): Versao[] {
  return [...versoes].sort((a, b) => b.numero - a.numero)
}

const NOME_CURTO_DO_PAPEL: Record<PapelDoArquivo, string> = {
  bpm: 'Fluxograma', png: 'Imagem', bpmn: 'BPMN', relatorio: 'Relatório', pdf_da_aprovacao: 'Aprovação',
}

/** "Fluxograma .bpm", "Relatório V2" (o numerado), "Relatório .pdf" (o antigo): o botão do arquivo no destaque da versão. */
export function rotuloCurtoDoArquivo({ papel, formato, numeroDoRelatorio }: Pick<ArquivoDaVersao, 'papel' | 'formato' | 'numeroDoRelatorio'>): string {
  if (numeroDoRelatorio !== undefined) return `${NOME_CURTO_DO_PAPEL[papel]} V${numeroDoRelatorio}`
  return `${NOME_CURTO_DO_PAPEL[papel]} .${formato.toLowerCase()}`
}

const FORMATO_DO_DIA_E_MES = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })

/** "02/10": o dia do envio na linha de destaque, no mesmo fuso do momento completo. */
export function formatarDiaEMes(iso: string): string {
  return FORMATO_DO_DIA_E_MES.format(new Date(iso))
}
