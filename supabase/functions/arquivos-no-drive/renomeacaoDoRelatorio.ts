// A ação renomear_relatorio (documentos-versoes, mudança de 2026-11-13; ADR 0047): um relatório numerado por chamada ganha no
// Drive o nome com R e então o banco grava o nome novo (renomear_relatorio_para_r), com o login de quem chamou. Quem pode (só o
// Administrador ativo) e a entrada já foram conferidos (decisao.ts, relatorioComR.ts). Ordem: ler o arquivo pela RLS, ver se ele
// se renomeia, conferir que está debaixo da raiz, renomear no Drive, gravar. Sem desfazer no Drive se o banco falhar: o arquivo
// fica com R no Drive e V no banco, e o clique seguinte o lista de novo, renomeia para o mesmo nome e grava. Nada aqui loga nem
// devolve outro nome que não o do próprio arquivo.
import { recusar } from '../_shared/decisao.ts'
import { situacaoDoNomeDoRelatorio, type EntradaRenomearRelatorio } from '../_shared/relatorioComR.ts'
import { recusaDoBanco, statusDaRecusaDoBanco } from '../_shared/registro.ts'
import { conferidorDaRaiz, type ContextoDoDrive } from './pastas.ts'
import { renomearNoDrive } from './renumeracao.ts'
import { responderJson, responderRecusa } from './respostas.ts'

interface RelatorioLido {
  drive_id: string
  nome: string
  papel: string
  numero_do_relatorio: number | null
}

// A leitura é a RLS, com o login de quem chamou: o que ela não mostra não existe para a função.
async function lerRelatorio(contexto: ContextoDoDrive, id: string): Promise<RelatorioLido | null> {
  const { data, error } = await contexto.cliente.from('arquivos_da_versao')
    .select('drive_id, nome, papel, numero_do_relatorio').eq('id', id).maybeSingle()
  if (error) throw new Error(`leitura de arquivos_da_versao falhou (código ${error.code}); esperado: arquivo visível`)
  return data as RelatorioLido | null
}

async function gravarNoBanco(contexto: ContextoDoDrive, arquivoId: string, nomeEsperado: string): Promise<Response> {
  const { data, error } = await contexto.cliente.rpc('renomear_relatorio_para_r', { p_arquivo: arquivoId, p_nome_esperado: nomeEsperado })
  if (!error) return responderJson(200, { nome: data as string })
  const recusa = recusaDoBanco(error)
  if (!recusa) throw new Error(`renomear_relatorio_para_r falhou (código ${error.code}); esperado: gravação ou recusa do banco`)
  return responderJson(statusDaRecusaDoBanco(recusa), recusa)
}

export async function renomearRelatorio(contexto: ContextoDoDrive, entrada: EntradaRenomearRelatorio): Promise<Response> {
  const relatorio = await lerRelatorio(contexto, entrada.arquivoId)
  if (!relatorio) return responderRecusa(recusar('sem_permissao'))
  const numero = relatorio.papel === 'relatorio' ? relatorio.numero_do_relatorio : null
  const situacao = situacaoDoNomeDoRelatorio(relatorio.nome, numero)
  if (situacao.tipo === 'com_r') return responderJson(200, { nome: relatorio.nome })
  if (situacao.tipo === 'fora_do_padrao') return responderRecusa(recusar('entrada_invalida', 'relatório fora do padrão'))
  if (!(await conferidorDaRaiz(contexto).itemSobARaiz(relatorio.drive_id))) return responderRecusa(recusar('sem_permissao'))
  await renomearNoDrive(contexto.token, relatorio.drive_id, situacao.nomeNovo)
  return await gravarNoBanco(contexto, entrada.arquivoId, relatorio.nome)
}
