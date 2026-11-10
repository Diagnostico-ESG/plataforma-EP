// Importação dos dados atuais, ticket 02 (ADR 0044): a decisão da função arquivos-no-drive para os pedidos com
// `importacao: true`. Arquivo puro, sem Deno nem npm:, testado no Vitest. Fica fora do decisao.ts, que está no limite de
// linhas. Com a marca, só o Administrador ativo pede; o processo concluído também recebe arquivo; a gravação é a função
// importar_versao (ou importar_anexo) do banco, que deixa de lado as travas de etapa do envio comum.
import {
  conferirChamador,
  conferirProcessoEmAndamento,
  eCorpo,
  falhar,
  lerBooleanoOpcional,
  recusar,
  type Acao,
  type Chamador,
  type Recusa,
  type Validacao,
} from './decisao.ts'
import type { ArquivoParaGravar, EntradaRegistrar } from './registro.ts'

const ACOES_DA_IMPORTACAO: readonly Acao[] = ['iniciar_envio', 'registrar']

/**
 * O pedido traz a marca da importação? Ausente vale falso; fora do formato, ou numa ação que não envia nem registra, recusa.
 * Com a marca, só o Administrador ativo (os demais perfis já passaram pela conferência de sempre da ação).
 */
export function lerImportacaoDoPedido(corpo: unknown, chamador: Chamador | null, acao: Acao): Validacao<boolean> {
  const marca = eCorpo(corpo) ? lerBooleanoOpcional(corpo, 'importacao') : { ok: true as const, valor: false }
  if (!marca.ok || !marca.valor) return marca
  if (!ACOES_DA_IMPORTACAO.includes(acao)) {
    return falhar('entrada_invalida', 'campo importacao: esperado só em iniciar_envio ou registrar')
  }
  const recusa = conferirChamador(chamador, acao) ?? (chamador?.perfil === 'administrador' ? null : recusar('sem_permissao'))
  return recusa ? { ok: false, recusa } : marca
}

/** Na importação, o processo concluído também recebe arquivo (versões antigas de processos já entregues). */
export function conferirProcessoDaImportacao(situacao: string): Recusa | null {
  return situacao === 'concluido' ? null : conferirProcessoEmAndamento(situacao)
}

/** A importação só cria versão nova: trocar um arquivo ou acrescentar a uma versão que existe é o caminho comum. */
export function conferirPedidoDaImportacao({ versaoId, arquivoId }: Pick<EntradaRegistrar, 'versaoId' | 'arquivoId'>): Recusa | null {
  if (versaoId === null && arquivoId === null) return null
  return recusar('entrada_invalida', 'campo importacao: esperado sem versao_id nem arquivo_id')
}

function tipoDaVersao({ historica, piloto }: Pick<EntradaRegistrar, 'historica' | 'piloto'>): string {
  if (historica) return 'historica'
  return piloto ? 'piloto' : 'sequencia'
}

/** Os parâmetros de importar_versao: o número do nome do arquivo e o do relatório (só na que não é histórica). */
export function parametrosDaImportacao(entrada: EntradaRegistrar, arquivos: ArquivoParaGravar[]): Record<string, unknown> {
  return {
    p_processo: entrada.processoId, p_numero: entrada.numero, p_tipo: tipoDaVersao(entrada), p_arquivos: arquivos,
    p_numero_do_relatorio: entrada.historica ? null : entrada.numeroDoRelatorio,
  }
}
