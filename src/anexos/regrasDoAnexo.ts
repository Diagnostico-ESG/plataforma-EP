import { LIMITE_DE_TAMANHO, extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { LIMITE_DO_NOME } from '../../supabase/functions/_shared/anexo.ts'
import { EXTENSOES_DO_ANEXO } from '../../supabase/functions/_shared/nomePadrao.ts'
import type { Anexo } from './tipos'

// A função do servidor e o banco repetem estas regras: o navegador só avisa antes do envio.
const LISTA_DE_FORMATOS = EXTENSOES_DO_ANEXO.map((extensao) => `.${extensao}`).join(', ').replace(/, ([^,]*)$/, ' ou $1')

function megabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',')
}

/** null se o arquivo serve de anexo; senão, a frase que aparece no formulário, dizendo o recebido e o esperado. */
export function recusaDoArquivoDoAnexo({ name, size }: Pick<File, 'name' | 'size'>): string | null {
  const extensao = extensaoDoNome(name)
  if (!EXTENSOES_DO_ANEXO.includes(extensao)) {
    return `O anexo precisa ser ${LISTA_DE_FORMATOS}; recebido: ${extensao ? `.${extensao}` : 'nenhuma'}.`
  }
  if (size === 0) return 'O anexo está vazio; recebido: 0 bytes.'
  if (size > LIMITE_DE_TAMANHO) return `O anexo pode ter até 20 MB; recebido: ${megabytes(size)} MB.`
  if (name.length > LIMITE_DO_NOME) return `O nome do anexo pode ter até ${LIMITE_DO_NOME} caracteres; recebido: ${name.length}.`
  return null
}

/** Do mais recente para o mais antigo; no mesmo instante, a ordem dada. */
export function ordenarAnexos(anexos: Anexo[]): Anexo[] {
  return [...anexos].sort((a, b) => Date.parse(b.enviadoEm) - Date.parse(a.enviadoEm))
}
