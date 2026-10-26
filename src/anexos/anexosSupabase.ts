import type { ClienteSupabase } from '../lib/supabase'
import { type EnviarBytes, chamarFuncao } from '../versoes/funcaoDoDrive'
import { falhaDaFuncaoDoAnexo } from './recusasDeAnexos'
import { ordenarAnexos } from './regrasDoAnexo'
import type { Anexo, ModuloDeAnexos, PedidoDeAnexo } from './tipos'

const COLUNAS_DO_ANEXO = 'id, nome, formato, tamanho, enviado_em, autor:usuarios(nome), etapa:etapas(nome)'

type LinhaDoAnexo = {
  id: string; nome: string; formato: string; tamanho: number; enviado_em: string
  autor: { nome: string } | null; etapa: { nome: string } | null
}

function anexoDaLinha(linha: LinhaDoAnexo): Anexo {
  return {
    id: linha.id, papel: 'anexo', nome: linha.nome, formato: linha.formato, tamanho: linha.tamanho, enviadoEm: linha.enviado_em,
    autor: linha.autor?.nome ?? null, etapa: linha.etapa?.nome ?? null,
  }
}

export function criarAnexosSupabase(cliente: ClienteSupabase, enviarBytes: EnviarBytes): ModuloDeAnexos {
  return {
    listarAnexos: (processoId) => listarAnexos(cliente, processoId),
    enviarAnexo: (pedido, aoProgredir) => enviarAnexo(cliente, enviarBytes, pedido, aoProgredir),
  }
}

async function listarAnexos(cliente: ClienteSupabase, processoId: string): Promise<Anexo[]> {
  const { data, error } = await cliente.from('anexos').select(COLUNAS_DO_ANEXO)
    .eq('processo_id', processoId).order('enviado_em', { ascending: false })
  if (error) throw new Error(`Falha ao ler os anexos do processo ${processoId}: ${error.message}`)
  return ordenarAnexos((data as unknown as LinhaDoAnexo[]).map(anexoDaLinha))
}

// Os bytes vão do navegador direto ao Google; o registro só acontece depois que o arquivo chegou ao Drive. O nome é o original:
// o anexo não tem número, versão nem nome padrão.
async function enviarAnexo(cliente: ClienteSupabase, enviarBytes: EnviarBytes, { processoId, arquivo }: PedidoDeAnexo,
  aoProgredir: (enviados: number, total: number) => void): Promise<void> {
  const { upload_url: endereco } = await chamarFuncao<{ upload_url: string }>(cliente, {
    acao: 'iniciar_envio', processo_id: processoId, papel: 'anexo', nome_original: arquivo.name, tamanho: arquivo.size,
  }, falhaDaFuncaoDoAnexo)
  const resposta = await enviarBytes(endereco, arquivo).catch(() => null)
  if (!resposta?.ok) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
  const { id } = (await resposta.json()) as { id: string }
  aoProgredir(1, 1)
  await chamarFuncao(cliente, {
    acao: 'registrar', processo_id: processoId, arquivos: [{ papel: 'anexo', drive_id: id }],
  }, falhaDaFuncaoDoAnexo)
}
