import type { SituacaoNoDrive } from './tipos'

const MARCAS: Record<SituacaoNoDrive, string | null> = {
  ok: null,
  alterado: 'Alterado fora da plataforma',
  nao_encontrado: 'Não encontrado no Drive',
}

/** O texto da pílula do arquivo conferido com o Drive; sem marca quando está certo ou ainda não foi conferido. */
export function marcaDaSituacao(situacao: SituacaoNoDrive | undefined): string | null {
  return situacao ? MARCAS[situacao] : null
}
