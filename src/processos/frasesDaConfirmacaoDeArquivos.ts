// As frases da Confirmação de arquivos (ADR 0028): a pergunta ao mover para a frente da Modelagem piloto ou da Relatório e
// modelagem técnica sem os arquivos delas, e o que o histórico diz que faltou.
import { CODIGO_DA_MODELAGEM_PILOTO } from './codigosDasEtapas'
import type { PecaQueFalta, TravaDeArquivos } from './travaDeArquivos'

/** O envio deu certo e o movimento depois dele não: os arquivos já estão no processo, e a pergunta não volta por eles. */
export const FRASE_DOS_ARQUIVOS_ENVIADOS = 'Os arquivos foram enviados, mas o processo não foi movido.'

export type PerguntaDeArquivos = { titulo: string; paragrafos: string[] }

/** O que falta na técnica, como a pergunta diz: o fluxograma é a versão do processo. */
const NA_PERGUNTA: Record<string, string> = { versao: 'o fluxograma', relatorio: 'o relatório', 'versao+relatorio': 'o fluxograma nem o relatório' }

function oQueFaltaNaTecnica(falta: PecaQueFalta[]): string {
  const faltando = NA_PERGUNTA[falta.join('+')]
  if (!faltando) throw new Error(`Falta "${falta.join(', ')}" não é da técnica; esperado versao, relatorio ou as duas.`)
  return faltando
}

// "ainda não tem o fluxograma nem o relatório desta etapa" / "ainda não tem a versão piloto"
function oQueAindaNaoTem({ codigo, falta }: TravaDeArquivos): string {
  return codigo === CODIGO_DA_MODELAGEM_PILOTO ? 'a versão piloto' : `${oQueFaltaNaTecnica(falta)} desta etapa`
}

const NOME_NA_PERGUNTA: Record<string, string> = { modelagem: 'Modelagem piloto', relatorio_modelagem_tecnica: 'Modelagem técnica' }

/** O nome da etapa como a pergunta e a janela de envio o dizem. */
export function nomeNaPergunta({ codigo, nome }: TravaDeArquivos): string {
  return NOME_NA_PERGUNTA[codigo] ?? nome
}

// "enviá-la" para a piloto, "enviá-lo" para uma peça só da técnica, "enviá-los" para as duas peças ou as duas etapas.
function enviarDepois(travas: TravaDeArquivos[]): string {
  const [unica] = travas
  if (travas.length > 1 || unica.falta.length > 1) return 'enviá-los'
  return unica.codigo === CODIGO_DA_MODELAGEM_PILOTO ? 'enviá-la' : 'enviá-lo'
}

/** A pergunta da janela, com o texto da etapa e só o que falta; uma pergunta só quando a ida atravessa as duas etapas. */
export function perguntaDeArquivos(travas: TravaDeArquivos[]): PerguntaDeArquivos {
  if (travas.length === 0) throw new Error('Nenhuma etapa com arquivos faltando; esperado ao menos uma para perguntar.')
  const fechamento = `Você pode avançar agora e ${enviarDepois(travas)} depois.`
  if (travas.length === 1) {
    const [trava] = travas
    return {
      titulo: `Faltam os arquivos da ${nomeNaPergunta(trava)}.`,
      paragrafos: [`Este processo ainda não tem ${oQueAindaNaoTem(trava)}. ${fechamento}`],
    }
  }
  return {
    titulo: 'Faltam os arquivos de duas etapas.',
    paragrafos: [...travas.map((trava) => `${nomeNaPergunta(trava)}: ainda não tem ${oQueAindaNaoTem(trava)}.`), fechamento],
  }
}

/** O que faltou numa etapa, como o histórico diz: "a versão piloto", "a versão", "o relatório" ou "a versão e o relatório". */
export function oQueFaltouNoHistorico(codigo: string, pecas: string[]): string {
  if (codigo === CODIGO_DA_MODELAGEM_PILOTO) return 'a versão piloto'
  const nomes = pecas.map((peca) => (peca === 'relatorio' ? 'o relatório' : 'a versão'))
  return nomes.join(' e ')
}
