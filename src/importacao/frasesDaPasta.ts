// As frases da seção "2. Arquivos das versões" (ticket 02): contagens da prévia e do resumo, o que ficou de fora, os avisos e as
// lacunas do relatório final (história 48c).
import type { ResumoDaPasta } from './enviarPasta'
import { contar } from './frasesDaImportacao'
import type { Lacunas } from './lacunasDaPasta'
import type { PapelNaPasta } from './nomeDoArquivoDaPasta'
import type { PreviaDaPasta } from './previaDaPasta'

const NOME_DO_PAPEL: Record<PapelNaPasta, string> = { bpm: '.bpm', png: '.png', relatorio: 'relatório .docx', pdf: '.pdf de relatório' }

function fraseDasVersoes(previa: PreviaDaPasta): string {
  const processos = previa.porProcesso.filter((p) => p.entram.length > 0).length
  const entram = `Vão entrar ${contar(previa.totalDeVersoes, 'versão', 'versões')} de ${contar(processos, 'processo', 'processos')}`
  return `${entram} (${contar(previa.arquivosDasVersoes, 'arquivo', 'arquivos')}).`
}

/** O que vai ao Drive e o que é pulado; cada parte só aparece quando tem o que contar. */
export function fraseDaPrevia(previa: PreviaDaPasta): string {
  const partes = [
    previa.totalDeVersoes > 0 ? fraseDasVersoes(previa) : '',
    previa.totalDePdfsQueFaltam > 0 ? `${contar(previa.totalDePdfsQueFaltam, '.pdf de relatório que faltou vai',
      '.pdfs de relatório que faltaram vão')} para os Outros anexos.` : '',
    previa.totalDePuladas > 0 ? `${contar(previa.totalDePuladas, 'versão já existe e será pulada', 'versões já existem e serão puladas')}.` : '',
  ]
  return partes.filter((parte) => parte !== '').join(' ')
}

/** O que não entra: versão sem .bpm, versão com dois .bpm, arquivo sem processo e arquivo fora do padrão. */
export function foraDaImportacao({ pasta, semProcesso }: PreviaDaPasta): string[] {
  const semProcessoConhecido = new Set(semProcesso.map((s) => s.chave))
  const doProcesso = <T extends { chave: string }>(lista: T[]) => lista.filter((v) => !semProcessoConhecido.has(v.chave))
  return [
    ...doProcesso(pasta.semBpm).map((v) => `${v.nomeDoProcesso} ${v.rotulo}: sem .bpm.`),
    ...doProcesso(pasta.duplicados).filter((d) => d.papel === 'bpm').map((d) => `${d.nomeDoProcesso} ${d.rotulo}: dois arquivos .bpm.`),
    ...semProcesso.map((s) => `${s.sigla} · ${s.nomeDoProcesso} (${s.rotulos.join(', ')}): sem processo na plataforma com essa sigla e esse nome.`),
    ...pasta.foraDoPadrao.map((caminho) => `${caminho}: fora do padrão do nome.`),
  ]
}

/**
 * Entra com ajuste: a letra corrigida, o .bpm da versão seguinte, o arquivo duplicado que fica de fora e a subpasta que ganha a linha nas Anotações. O mesmo
 * texto na prévia (história 44) e no resumo, por isso sem tempo verbal de antes ou depois do envio.
 */
export function avisosDaPasta({ porProcesso, pasta }: PreviaDaPasta): string[] {
  const conhecidos = new Set(porProcesso.map((p) => p.processo.chave))
  const letras = porProcesso.flatMap((p) => p.entram.filter((v) => v.letraCorrigida)
    .map((v) => `${p.processo.nome} ${v.rotulo}: arquivo com letra diferente da do .bpm, ligado à ${v.rotulo}.`))
  const bpmDaSeguinte = porProcesso.flatMap((p) => p.entram.filter((v) => v.bpmDaVersao !== null)
    .map((v) => `${p.processo.nome} ${v.rotulo}: sem .bpm próprio; usa o .bpm da ${String(v.bpmDaVersao)}, que tem as versões anteriores em abas.`))
  const duplicados = pasta.duplicados.filter((d) => d.papel !== 'bpm' && conhecidos.has(d.chave))
    .map((d) => `${d.nomeDoProcesso} ${d.rotulo}: dois arquivos de ${NOME_DO_PAPEL[d.papel]}; nenhum dos dois entra.`)
  const subpastas = porProcesso.filter((p) => p.subpasta !== null)
    .map((p) => `${p.processo.nome}: arquivos da subpasta ${String(p.subpasta)}, com uma linha nas Anotações.`)
  return [...letras, ...bpmDaSeguinte, ...duplicados, ...subpastas]
}

function faltam(numeros: number[]): string {
  const rotulos = numeros.map((n) => `V${String(n)}`)
  return rotulos.length === 1 ? `falta a ${rotulos[0]}` : `faltam ${rotulos.join(', ')}`
}

export function frasesDasLacunas({ buracos, soNaPasta, soNaPlanilha }: Lacunas): string[] {
  return [
    ...buracos.map((b) => `${b.nomeDoProcesso}: ${faltam(b.faltam)} na numeração da pasta.`),
    ...soNaPasta.map((l) => `${l.nomeDoProcesso} V${String(l.numero)}: na pasta e não na planilha.`),
    ...soNaPlanilha.map((l) => `${l.nomeDoProcesso} V${String(l.numero)}: na planilha e não na pasta.`),
  ]
}

export function fraseDoResumo(resumo: ResumoDaPasta): string {
  return `${contar(resumo.criadas, 'versão criada', 'versões criadas')}, ${contar(resumo.puladas, 'pulada', 'puladas')}.`
}
