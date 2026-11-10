// As frases da seção "2. Arquivos das versões" (ticket 02): contagens da prévia e do resumo, o que ficou de fora, os avisos e as
// lacunas do relatório final (história 48c).
import type { ResumoDaPasta } from './enviarPasta'
import { contar } from './frasesDaImportacao'
import type { Lacunas } from './lacunasDaPasta'
import type { PapelNaPasta } from './nomeDoArquivoDaPasta'
import type { PreviaDaPasta } from './previaDaPasta'

const NOME_DO_PAPEL: Record<PapelNaPasta, string> = { bpm: '.bpm', png: '.png', relatorio: 'relatório .docx', pdf: '.pdf de relatório' }

export function fraseDaPrevia(previa: PreviaDaPasta): string {
  const processos = previa.porProcesso.filter((p) => p.entram.length > 0).length
  const entram = `Vão entrar ${contar(previa.totalDeVersoes, 'versão', 'versões')} de ${contar(processos, 'processo', 'processos')}`
  const puladas = previa.totalDePuladas === 0 ? ''
    : ` ${contar(previa.totalDePuladas, 'versão já existe e será pulada', 'versões já existem e serão puladas')}.`
  return `${entram} (${contar(previa.totalDeArquivos, 'arquivo', 'arquivos')}).${puladas}`
}

/** O que não entra: versão sem .bpm, versão com dois .bpm, arquivo sem processo e arquivo fora do padrão. */
export function foraDaImportacao({ pasta, semProcesso }: PreviaDaPasta): string[] {
  const semProcessoConhecido = new Set(semProcesso.map((s) => s.chave))
  const doProcesso = <T extends { chave: string }>(lista: T[]) => lista.filter((v) => !semProcessoConhecido.has(v.chave))
  return [
    ...doProcesso(pasta.semBpm).map((v) => `${v.nomeDoProcesso} ${v.rotulo}: sem .bpm.`),
    ...doProcesso(pasta.duplicados).filter((d) => d.papel === 'bpm').map((d) => `${d.nomeDoProcesso} ${d.rotulo}: dois arquivos .bpm.`),
    ...semProcesso.map((s) => `${s.chave.split('|')[0]} · ${s.nomeDoProcesso} (${s.rotulos.join(', ')}): sem processo na plataforma com essa sigla e esse nome.`),
    ...pasta.foraDoPadrao.map((caminho) => `${caminho}: fora do padrão do nome.`),
  ]
}

/** Entrou com ajuste: a letra corrigida, o arquivo duplicado que ficou de fora e a subpasta anotada. */
export function avisosDaPasta({ porProcesso, pasta }: PreviaDaPasta): string[] {
  const conhecidos = new Set(porProcesso.map((p) => p.processo.chave))
  const letras = porProcesso.flatMap((p) => p.entram.filter((v) => v.letraCorrigida)
    .map((v) => `${p.processo.nome} ${v.rotulo}: arquivo com letra diferente da do .bpm; entrou na ${v.rotulo}.`))
  const duplicados = pasta.duplicados.filter((d) => d.papel !== 'bpm' && conhecidos.has(d.chave))
    .map((d) => `${d.nomeDoProcesso} ${d.rotulo}: dois arquivos de ${NOME_DO_PAPEL[d.papel]}; nenhum dos dois entrou.`)
  const subpastas = porProcesso.filter((p) => p.subpasta !== null)
    .map((p) => `${p.processo.nome}: arquivos da subpasta ${String(p.subpasta)}; anotado nas Anotações.`)
  return [...letras, ...duplicados, ...subpastas]
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
