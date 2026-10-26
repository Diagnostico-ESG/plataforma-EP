import type { ArquivoDaVersao, PapelDoArquivo, Versao } from '../versoes/tipos'

function arquivo(numero: number, papel: PapelDoArquivo, formato: string): ArquivoDaVersao {
  const sufixo = papel === 'relatorio' ? '_Relatório' : ''
  return { id: `a${numero}-${papel}`, papel, nome: `TSA_V${numero}_Emitir Ofício${sufixo}.${formato}`, formato, tamanho: 100 }
}

/** Uma versão inventada do "Emitir Ofício" (p1), com o .bpm e o .png (os obrigatórios). */
export function versaoDeTeste(numero: number, mudancas: Partial<Versao> = {}): Versao {
  return {
    id: `v${numero}`, numero, historica: false, piloto: false, enviadaEm: `2026-10-0${numero}T13:00:00Z`, autor: 'Ana Teste',
    etapa: 'Reunião de modelagem', arquivos: [arquivo(numero, 'bpm', 'bpm'), arquivo(numero, 'png', 'png')],
    ...mudancas,
  }
}

export function arquivoDeTeste(numero: number, papel: PapelDoArquivo, formato: string): ArquivoDaVersao {
  return arquivo(numero, papel, formato)
}

/** Arquivos que passam nas conferências do navegador. */
export const BPMN_VALIDO = new File(
  ['<?xml version="1.0"?><definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="d"/>'], 'fluxo.bpmn',
)
export const BPM_VALIDO = new File(['b'], 'fluxo.bpm')
export const PNG_VALIDO =new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])], 'fluxo.png')

/** Para achar um arquivo pelo nome dentro do nome acessível do botão ("Baixar Imagem .png (TSA_V1_...png)"). */
export const comNome = (trecho: string) => (nome: string) => nome.includes(trecho)
