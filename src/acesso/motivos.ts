import type { MotivoDeRecusa, RecusaDeEntrada } from './tipos'

// O banco recusa com "motivo:email" (private.recusa_de_entrada); o Auth pode acrescentar um prefixo ao texto.
const PADRAO_DA_RECUSA = /\b(fora_do_dominio|sem_autorizacao|inativo):(\S*)/

export function lerRecusa(texto: string | null): RecusaDeEntrada | null {
  const achado = texto?.match(PADRAO_DA_RECUSA)
  if (!achado) return null
  return { motivo: achado[1] as MotivoDeRecusa, email: achado[2] }
}

// Depois do Google, o Auth volta com o erro na consulta (?) ou no fragmento (#), conforme o fluxo.
// Erro sem motivo conhecido (ex.: cadastro desligado no painel) não pode voltar em silêncio à tela de entrada.
export function lerRecusaDaUrl(endereco: string): RecusaDeEntrada | null {
  const url = new URL(endereco)
  const doFragmento = new URLSearchParams(url.hash.slice(1))
  const descricao = url.searchParams.get('error_description') ?? doFragmento.get('error_description')
  if (!descricao) return null
  return lerRecusa(descricao) ?? { motivo: 'desconhecido', email: '' }
}

export function mensagemDaRecusa({ motivo, email }: RecusaDeEntrada): string {
  if (motivo === 'fora_do_dominio') return `Use sua conta @ccivil.pr.gov.br. A conta ${email} não é institucional.`
  if (motivo === 'sem_autorizacao') return `A conta ${email} ainda não foi autorizada. Peça a um administrador.`
  if (motivo === 'inativo') return 'Seu acesso está inativo. Fale com um administrador.'
  return 'Não foi possível entrar com essa conta. Tente de novo ou fale com um administrador.'
}
