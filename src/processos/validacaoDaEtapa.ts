// O banco confere de novo (restrição etapas_codigo_formato, mesmo formato); aqui a pessoa vê o problema antes de enviar.
const FORMATO_DO_CODIGO = /^[a-z0-9_]{2,40}$/

/** Nome e código como a pessoa digitou; na edição o código não muda e vem null. */
export type CamposDaEtapa = { nome: string; codigo: string | null }

export function problemaNaEtapa({ nome, codigo }: CamposDaEtapa): string | null {
  if (nome.trim() === '') return 'O nome da etapa é obrigatório.'
  if (codigo === null || FORMATO_DO_CODIGO.test(codigo)) return null
  return `O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "${codigo}".`
}
