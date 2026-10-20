// Devolve o resultado ao banco pela função `registrar_resultado_das_planilhas`, chamável sem login (ADR 0018): a trava
// é a ficha de uso único, conferida por hash dentro do banco. Usa só a chave publicável; esta função não lê o banco.
import type { CodigoDoMotivo } from '../_shared/planilhasMotivo.ts'
import type { Configuracao } from './configuracao.ts'

export async function registrarNoBanco(
  config: Configuracao,
  tentativa: string,
  ficha: string,
  deuCerto: boolean,
  motivo: CodigoDoMotivo | null,
): Promise<void> {
  const resposta = await fetch(`${config.urlDoBanco}/rest/v1/rpc/registrar_resultado_das_planilhas`, {
    method: 'POST',
    // A chave publicável nova não é um JWT: vai só em apikey, sem o cabeçalho Authorization.
    headers: { 'Content-Type': 'application/json', apikey: config.chavePublicavel },
    body: JSON.stringify({ p_tentativa: tentativa, p_ficha: ficha, p_deu_certo: deuCerto, p_motivo: motivo }),
  })
  // O corpo da resposta do banco não é lido nem repetido; o status basta para o aviso.
  if (!resposta.ok) throw new Error(`o banco recusou o resultado (status ${resposta.status}); esperado: 2xx`)
}
