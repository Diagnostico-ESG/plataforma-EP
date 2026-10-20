// Único ponto que lê os segredos da função (gravados pelo usuário com `npx supabase secrets set`; roteiro em
// docs/planilhas-publicar-a-funcao.md). Nada disso fica no código, no .env.example ou no git. A chave secreta do
// Supabase não é lida (ADR 0018): a função só devolve o resultado, com a chave publicável. A mensagem de falta cita o
// nome do segredo, nunca um valor.
import { lerContaDeServico } from '../_shared/drive.ts'

export interface Configuracao {
  contaEmail: string
  contaChave: string
  /** A senha interna que o banco envia em cada pedido; a mesma guardada no cofre do banco. */
  senhaInterna: string
  urlDoBanco: string
  /** A chave publicável do projeto (a mesma do front-end), usada só para devolver o resultado. */
  chavePublicavel: string
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
    senhaInterna: lerSegredo('EP_PLANILHAS_SENHA'),
    urlDoBanco: lerSegredo('SUPABASE_URL'),
    chavePublicavel: lerSegredo('EP_CHAVE_PUBLICAVEL'),
  }
}
