import type { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ArquivosDoProcesso } from '../processos/tipos'
import type { VersoesFalso } from '../versoes/VersoesFalso'
import type { Versao } from '../versoes/tipos'

/** O que a view do banco diz que o processo tem, calculado das versões: piloto, em sequência e relatório numerado. */
export function arquivosDasVersoes(versoes: Versao[]): ArquivosDoProcesso {
  return {
    versaoPiloto: versoes.some((versao) => versao.piloto),
    versaoEmSequencia: versoes.some((versao) => !versao.historica && !versao.piloto),
    relatorioNumerado: versoes.some((versao) => versao.arquivos.some((arquivo) => arquivo.papel === 'relatorio' && arquivo.numeroDoRelatorio !== undefined)),
  }
}

/**
 * Liga as duas falsas como o banco liga as tabelas: a cada versão, relatório ou arquivo registrado, o processo que já trazia
 * `arquivos` passa a ter o que as versões dele têm (a trava de arquivos da falsa de processos lê isso). Quem não traz
 * `arquivos` continua sem trava.
 */
export function ligarArquivosDoProcesso(processos: ProcessosFalso, versoes: VersoesFalso): void {
  const anterior = versoes.aoRegistrar
  versoes.aoRegistrar = (processoId, evento) => {
    anterior?.(processoId, evento)
    processos.processos = processos.processos.map((processo) => (
      processo.id === processoId && processo.arquivos ? { ...processo, arquivos: arquivosDasVersoes(versoes.versoes[processoId] ?? []) } : processo
    ))
  }
}
