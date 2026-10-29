import type { NomeIcone } from '../components/Icone'

const POR_FORMATO: Record<string, NomeIcone> = {
  docx: 'arquivoRelatorio', bpmn: 'arquivoBpmn', bpm: 'arquivoBpm', png: 'arquivoImagem',
}

/** O ícone do tipo do arquivo, pelo formato (.docx, .bpmn, .bpm, .png); qualquer outro usa o ícone genérico. */
export function iconeDoArquivo(formato: string): NomeIcone {
  return POR_FORMATO[formato.toLowerCase()] ?? 'arquivo'
}
