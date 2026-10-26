import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessoLido } from '../processos/tipos'

// Os eventos que os gatilhos do banco gravam (migração data_da_validacao_e_pdf_da_aprovacao), para as falsas registrarem como
// ele: a data no processo, o .pdf na aprovação (referência no processo, como os outros eventos da aprovação).

function estadoDaData(processo: ProcessoLido, data: string | null): Record<string, unknown> {
  return { nome: processo.nome, setor_sigla: processo.setorSigla, data_da_validacao: data }
}

/** "Registrar" quando a data estava vazia, "alterar" nas demais (inclusive apagar, que deixa o depois vazio). */
export function eventoDaDataDaValidacao(
  processo: ProcessoLido, antes: string | null, depois: string | null, autor: string, ocorridoEm: string,
): EventoDoCadastro {
  return {
    id: Date.now(), ocorridoEm, autor, acao: antes === null ? 'registrar_data_da_validacao' : 'alterar_data_da_validacao',
    entidade: 'processo', entidadeRef: processo.id, antes: estadoDaData(processo, antes), depois: estadoDaData(processo, depois),
  }
}

export type DonoDoPdf = { versao: number; nomeDoProcesso: string; sigla: string; autor: string }

/** O .pdf enviado (antes vazio) ou trocado (antes com o nome e o hash do que saiu). */
export function eventoDoPdfDaAprovacao(
  processoId: string, acao: 'enviar_pdf' | 'substituir_pdf', dono: DonoDoPdf,
  pdf: { nome: string; hash: string; hashQueSaiu?: string },
): EventoDoCadastro {
  return {
    id: Date.now(), ocorridoEm: new Date().toISOString(), autor: dono.autor, acao, entidade: 'aprovacao', entidadeRef: processoId,
    antes: pdf.hashQueSaiu === undefined ? null : { nome: pdf.nome, hash_md5: pdf.hashQueSaiu },
    depois: {
      processo_nome: dono.nomeDoProcesso, setor_sigla: dono.sigla, versao: `V${dono.versao}`, nome: pdf.nome, hash_md5: pdf.hash,
    },
  }
}
