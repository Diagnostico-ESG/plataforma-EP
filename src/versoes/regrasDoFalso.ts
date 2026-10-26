import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { falhaDaFuncao } from './recusasDeVersoes'
import { proximoNumeroDoRelatorio } from './relatorioQueVale'
import { haVersaoEmSequencia, haVersaoNova, ordenarVersoes, proximoNumero, rotuloDaVersao } from './rotulos'
import type { PedidoDeRelatorio, PedidoDeVersao, Versao } from './tipos'

// As regras que o banco impõe às versões e aos relatórios, e os eventos que os gatilhos dele gravam, para a falsa de versões
// (src/versoes/VersoesFalso.ts) recusar e registrar como o módulo real.

/** O que o falso precisa saber do processo para nomear os arquivos e guardar a etapa, como o banco. */
export type ProcessoDoFalso = { sigla: string; nome: string; etapa: string | null }

/** As regras do banco para o tipo de versão do pedido: histórica, piloto ou em sequência. */
export function conferirPedido(doProcesso: Versao[], pedido: PedidoDeVersao, historica: boolean, piloto: boolean): void {
  if (historica) conferirHistorica(doProcesso, pedido)
  else if (piloto) conferirPiloto(doProcesso, pedido)
  else conferirBpm(pedido)
  if (!historica) conferirRelatorioJunto(doProcesso, pedido)
}

// A versão piloto e a em sequência precisam só do .bpm; o .png e o .bpmn são opcionais (migração versoes_por_etapa).
function conferirBpm(pedido: PedidoDeVersao): void {
  if (!pedido.arquivos.some(({ papel }) => papel === 'bpm')) throw falhaDaFuncao('versao_sem_bpm', '')
}

// A piloto só entra antes da primeira em sequência, com número maior que o de todas as versões do processo.
function conferirPiloto(doProcesso: Versao[], pedido: PedidoDeVersao): void {
  if (haVersaoEmSequencia(doProcesso)) throw falhaDaFuncao('piloto_depois_de_versao_em_sequencia', '')
  const maior = proximoNumero(doProcesso) - 1
  if (pedido.numero <= maior) throw falhaDaFuncao('numero_da_piloto_nao_maior', String(maior))
  conferirBpm(pedido)
}

// As regras que o banco impõe à histórica (migração versoes_historicas), com as mesmas frases do módulo real.
function conferirHistorica(doProcesso: Versao[], pedido: PedidoDeVersao): void {
  if (haVersaoNova(doProcesso)) throw falhaDaFuncao('historica_depois_de_versao_nova', '')
  if (doProcesso.some((versao) => versao.numero === pedido.numero)) {
    throw falhaDaFuncao('numero_historico_repetido', String(pedido.numero))
  }
  const papeis = pedido.arquivos.map(({ papel }) => papel)
  if (!papeis.includes('bpm') && !(papeis.includes('bpmn') && papeis.includes('png'))) {
    throw falhaDaFuncao('historica_sem_arquivo_de_fluxograma', '')
  }
}

// O relatório novo (junto com a versão que não é histórica) só vale em .docx, e o número da prévia precisa ser o próximo (ADR 0026).
function conferirRelatorioJunto(doProcesso: Versao[], pedido: PedidoDeVersao): void {
  const relatorio = pedido.arquivos.find(({ papel }) => papel === 'relatorio')
  if (!relatorio) return
  if (extensaoDoNome(relatorio.arquivo.name) !== 'docx') throw falhaDaFuncao('relatorio_so_docx', '')
  conferirNumeroDoRelatorio(doProcesso, pedido.numeroDoRelatorio)
}

function conferirNumeroDoRelatorio(doProcesso: Versao[], daPrevia: number | undefined): void {
  const proximo = proximoNumeroDoRelatorio(doProcesso)
  if (daPrevia !== undefined && daPrevia !== proximo) throw falhaDaFuncao('numero_do_relatorio_mudou', String(proximo))
}

/**
 * As regras do relatório sozinho (função enviar_relatorio): vai para a versão mais recente que não é histórica; os números da
 * prévia precisam ser os de agora; só .docx. Devolve essa versão.
 */
export function conferirRelatorioSozinho(doProcesso: Versao[], pedido: PedidoDeRelatorio): Versao {
  const alvo = ordenarVersoes(doProcesso).find((versao) => !versao.historica)
  if (!alvo) throw falhaDaFuncao('relatorio_sem_versao', '')
  if (alvo.numero !== pedido.numeroDaVersao) throw falhaDaFuncao('numero_da_versao_mudou', String(alvo.numero))
  conferirNumeroDoRelatorio(doProcesso, pedido.numeroDoRelatorio)
  if (extensaoDoNome(pedido.arquivo.name) !== 'docx') throw falhaDaFuncao('relatorio_so_docx', '')
  return alvo
}

// O evento do gatilho da substituição (migração substituir_arquivo): o antes guarda o nome e o hash do que saiu.
export function eventoDaSubstituicao(processoId: string, versao: Versao, processo: ProcessoDoFalso, nome: string,
  hashes: { saiu: string; entrou: string }): EventoDoCadastro {
  return {
    id: Date.now(), ocorridoEm: new Date().toISOString(), autor: 'Pessoa de Teste', acao: 'substituir', entidade: 'versao',
    entidadeRef: processoId, antes: { nome, hash_md5: hashes.saiu },
    depois: {
      rotulo: rotuloDaVersao(versao), processo_nome: processo.nome, setor_sigla: processo.sigla, nome, hash_md5: hashes.entrou,
    },
  }
}

// O evento que o gatilho do banco grava (migração versoes): entidade "versao", referência no processo; `extras` leva o que
// o evento acrescenta ao estado (o papel do arquivo acrescentado, o número do relatório enviado).
export function eventoDaVersao(processoId: string, versao: Versao, processo: ProcessoDoFalso, acao: string,
  extras: Record<string, string | number> = {}): EventoDoCadastro {
  const depois = {
    rotulo: rotuloDaVersao(versao), processo_nome: processo.nome, setor_sigla: processo.sigla, etapa: versao.etapa,
    arquivos: versao.arquivos.map(({ papel, nome }) => ({ papel, nome })), ...extras,
  }
  return {
    id: Date.now(), ocorridoEm: versao.enviadaEm, autor: 'Pessoa de Teste', acao, entidade: 'versao',
    entidadeRef: processoId, antes: null, depois,
  }
}
