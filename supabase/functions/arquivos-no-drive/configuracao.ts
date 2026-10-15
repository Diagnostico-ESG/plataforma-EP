// Único ponto que lê os segredos da função (gravados pelo usuário com `npx supabase secrets set`).
// Nada disso fica no código, no .env.example ou no git. A chave secreta do Supabase não é lida.
import { lerContaDeServico } from '../_shared/drive.ts'

export interface Configuracao {
  contaEmail: string
  contaChave: string
  raizId: string
  origensAceitas: string
}

function lerSegredo(nome: string): string {
  const valor = Deno.env.get(nome)?.trim()
  if (!valor) {
    throw new Error(`segredo ${nome} ausente (recebido: vazio); esperado: gravado com npx supabase secrets set`)
  }
  return valor
}

export function lerConfiguracao(): Configuracao {
  const conta = lerContaDeServico(lerSegredo('EP_DRIVE_CONTA_JSON_BASE64'))
  return {
    contaEmail: conta.email,
    contaChave: conta.chave,
    raizId: lerSegredo('EP_DRIVE_RAIZ_ID'),
    origensAceitas: lerSegredo('EP_ORIGENS_ACEITAS'),
  }
}
