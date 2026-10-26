// A ação retirar (documentos-versoes, ticket 13; ADR 0027): o arquivo do anexo vai para a lixeira do Drive (que o apaga de vez
// em 30 dias) e então a linha é apagada com o login de quem chamou. Quem pode e a entrada já foram conferidas (decisao.ts,
// anexo.ts). Ordem: ler o anexo, conferir o processo, conferir o arquivo no Drive, lixeira, apagar a linha. Se o banco
// recusar depois da lixeira, o arquivo volta dela. Nada aqui loga nem devolve o nome do anexo.
import { RECUSA_ANEXO_JA_RETIRADO, type EntradaRetirarAnexo } from '../_shared/anexo.ts'
import type { LidoNoDrive } from '../_shared/conferencia.ts'
import { recusar } from '../_shared/decisao.ts'
import { recusaDoBanco, statusDaRecusaDoBanco } from '../_shared/registro.ts'
import { lerProcesso, recusaDoProcesso } from './acoes.ts'
import { chamarDrive, lerNoDriveOuNulo } from './google.ts'
import { API_DE_ARQUIVOS, anexoNaSubpastaDoProcesso, type ContextoDoDrive } from './pastas.ts'
import { responderJson, responderRecusa } from './respostas.ts'

interface AnexoGuardado {
  processo_id: string
  drive_id: string
}

/** O que fazer com o arquivo no Drive: mandar à lixeira, deixar como está (já na lixeira ou sumido) ou recusar (fora da subpasta "Anexos"). */
type DestinoNoDrive = 'lixeira' | 'nada' | 'fora_da_subpasta'

// A leitura é a RLS, com o login de quem chamou: o que ela não mostra (inclusive o já retirado) não existe para a função.
async function lerAnexo(contexto: ContextoDoDrive, id: string): Promise<AnexoGuardado | null> {
  const { data, error } = await contexto.cliente.from('anexos').select('processo_id, drive_id').eq('id', id).maybeSingle()
  if (error) throw new Error(`leitura de anexos falhou (código ${error.code}); esperado: anexo visível`)
  return data as AnexoGuardado | null
}

// O drive_id guardado é escrito por quem tem perfil de escrita: só é usado com a conta de serviço se o arquivo está dentro da
// subpasta "Anexos" do processo (revisão de segurança de 2026-10-26: sem isso, um anexo falso mandaria à lixeira o arquivo de
// uma versão). Arquivo que o Drive não acha (apagado de vez) não impede a retirada: é o que a marca "não encontrado" da
// lista mostra, e a linha precisa sair.
async function destinoDoArquivo(contexto: ContextoDoDrive, processoId: string, driveId: string): Promise<DestinoNoDrive> {
  const lido = await lerNoDriveOuNulo<LidoNoDrive>(contexto.token, `${API_DE_ARQUIVOS}/${encodeURIComponent(driveId)}?fields=id,trashed`)
  if (!lido) return 'nada'
  if (!(await anexoNaSubpastaDoProcesso(contexto, processoId, driveId))) return 'fora_da_subpasta'
  return lido.trashed === true ? 'nada' : 'lixeira'
}

// Manda o arquivo para a lixeira ou o tira dela; nunca o apaga de vez.
async function mudarLixeira(token: string, driveId: string, naLixeira: boolean): Promise<void> {
  await chamarDrive(token, `${API_DE_ARQUIVOS}/${encodeURIComponent(driveId)}?fields=id`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ trashed: naLixeira }),
  })
}

function respostaDaRecusaDoBanco(erro: { message: string; code?: string }): Response {
  const recusa = recusaDoBanco(erro)
  if (!recusa) throw new Error(`apagar em anexos falhou (código ${erro.code}); esperado: retirada ou recusa do banco`)
  return responderJson(statusDaRecusaDoBanco(recusa), recusa)
}

function respostaDoAnexoJaRetirado(): Response {
  return responderJson(statusDaRecusaDoBanco(RECUSA_ANEXO_JA_RETIRADO), RECUSA_ANEXO_JA_RETIRADO)
}

// ponytail: duas retiradas ao mesmo tempo mandam o mesmo arquivo à lixeira duas vezes (inofensivo); a que apaga a linha vale.
// Sem linha apagada, outra retirada já valeu e o arquivo fica na lixeira. Se tirar da lixeira falhar, o arquivo fica lá e a
// conferência o marca "não encontrado" até alguém restaurá-lo no Drive; a recusa do banco é a que volta para a tela.
async function apagarOuDesfazer(contexto: ContextoDoDrive, anexoId: string, driveId: string, naLixeira: boolean): Promise<Response> {
  const { data, error } = await contexto.cliente.from('anexos').delete().eq('id', anexoId).select('id')
  if (error) {
    if (naLixeira) await mudarLixeira(contexto.token, driveId, false).catch(() => undefined)
    return respostaDaRecusaDoBanco(error)
  }
  return (data?.length ?? 0) > 0 ? responderJson(200, { retirado: true }) : respostaDoAnexoJaRetirado()
}

export async function retirarAnexo(contexto: ContextoDoDrive, entrada: EntradaRetirarAnexo): Promise<Response> {
  const anexo = await lerAnexo(contexto, entrada.anexoId)
  if (!anexo) return respostaDoAnexoJaRetirado()
  const processo = await lerProcesso(contexto, anexo.processo_id)
  if (!processo) return responderRecusa(recusar('entrada_invalida', 'processo não encontrado'))
  const foraDeAndamento = recusaDoProcesso(processo, 'anexo')
  if (foraDeAndamento) return responderRecusa(foraDeAndamento)
  const destino = await destinoDoArquivo(contexto, anexo.processo_id, anexo.drive_id)
  if (destino === 'fora_da_subpasta') return responderRecusa(recusar('sem_permissao'))
  if (destino === 'lixeira') await mudarLixeira(contexto.token, anexo.drive_id, true)
  return await apagarOuDesfazer(contexto, entrada.anexoId, anexo.drive_id, destino === 'lixeira')
}
