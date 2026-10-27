import { describe, expect, it } from 'vitest'
import { travasDaIda, travasQueFaltam } from './travaDeArquivos'
import type { ArquivosDoProcesso, EtapaDoCatalogo } from './tipos'

const etapa = (ordem: number, codigo: string, nome: string, ativa = true): EtapaDoCatalogo => ({ id: `id-${codigo}`, codigo, nome, ordem, ativa })

const NAO_INICIADOS = etapa(1, 'nao_iniciados', 'Não iniciados')
const MODELAGEM = etapa(2, 'modelagem', 'Modelagem piloto')
const TECNICA = etapa(3, 'relatorio_modelagem_tecnica', 'Relatório e modelagem técnica')
const REVISAO = etapa(4, 'revisao_interna', 'Revisão interna')
const VALIDACAO = etapa(5, 'revisao_setor', 'Validação com o setor')
const CONCLUIDOS = etapa(6, 'concluidos', 'Concluídos')
const CATALOGO = [NAO_INICIADOS, MODELAGEM, TECNICA, REVISAO, VALIDACAO, CONCLUIDOS]

const NADA: ArquivosDoProcesso = { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false }

function travas(de: EtapaDoCatalogo, para: EtapaDoCatalogo, arquivos?: ArquivosDoProcesso, catalogo = CATALOGO) {
  return travasQueFaltam({ de, para, catalogo, arquivos })
}
const codigos = (lista: ReturnType<typeof travas>) => lista.map((trava) => trava.codigo)

describe('travasQueFaltam', () => {
  it('não pergunta quando a tela não sabe o que o processo tem', () => {
    expect(travas(MODELAGEM, TECNICA)).toEqual([])
  })

  it('pede a versão piloto ao sair da Modelagem piloto', () => {
    expect(travas(MODELAGEM, TECNICA, NADA)).toEqual([{ codigo: 'modelagem', nome: 'Modelagem piloto', falta: ['versao_piloto'] }])
  })

  it('aceita a versão em sequência no lugar da piloto, que já não pode entrar depois dela', () => {
    expect(travas(MODELAGEM, TECNICA, { ...NADA, versaoEmSequencia: true })).toEqual([])
  })

  it('pede a versão e o relatório ao sair da técnica, dizendo só o que falta', () => {
    expect(travas(TECNICA, REVISAO, { ...NADA, versaoPiloto: true })[0].falta).toEqual(['versao', 'relatorio'])
    expect(travas(TECNICA, REVISAO, { ...NADA, versaoEmSequencia: true })[0].falta).toEqual(['relatorio'])
    expect(travas(TECNICA, REVISAO, { ...NADA, relatorioNumerado: true })[0].falta).toEqual(['versao'])
  })

  it('deixa sair da técnica com a versão e o relatório, ligados ou não', () => {
    expect(travas(TECNICA, REVISAO, { versaoPiloto: false, versaoEmSequencia: true, relatorioNumerado: true })).toEqual([])
  })

  it('passando por cima das duas etapas devolve as duas, a Modelagem piloto primeiro', () => {
    expect(codigos(travas(NAO_INICIADOS, CONCLUIDOS, NADA))).toEqual(['modelagem', 'relatorio_modelagem_tecnica'])
    expect(travas(NAO_INICIADOS, CONCLUIDOS, { ...NADA, versaoPiloto: true })).toEqual([{
      codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', falta: ['versao', 'relatorio'],
    }])
  })

  it('não pergunta ao voltar, na mesma etapa nem com o processo que já estava adiante', () => {
    expect(travas(REVISAO, MODELAGEM, NADA)).toEqual([])
    expect(travas(TECNICA, TECNICA, NADA)).toEqual([])
    expect(travas(REVISAO, VALIDACAO, NADA)).toEqual([])
    expect(travas(CONCLUIDOS, REVISAO, NADA)).toEqual([])
  })

  it('não pergunta ao chegar na etapa com arquivos, só ao sair dela', () => {
    expect(travas(NAO_INICIADOS, MODELAGEM, NADA)).toEqual([])
    expect(travas(MODELAGEM, TECNICA, { ...NADA, versaoPiloto: true })).toEqual([])
  })

  it('ignora a etapa desativada no catálogo', () => {
    const semModelagem = CATALOGO.map((e) => (e.codigo === 'modelagem' ? { ...e, ativa: false } : e))
    expect(codigos(travas(NAO_INICIADOS, REVISAO, NADA, semModelagem))).toEqual(['relatorio_modelagem_tecnica'])
    const semAsDuas = semModelagem.map((e) => (e.codigo === TECNICA.codigo ? { ...e, ativa: false } : e))
    expect(travas(NAO_INICIADOS, CONCLUIDOS, NADA, semAsDuas)).toEqual([])
  })

  it('segue a ordem do catálogo quando uma etapa nova entra entre as duas', () => {
    const nova = etapa(2.5, 'etapa_nova', 'Etapa nova')
    const comNova = [...CATALOGO, nova]
    expect(codigos(travas(nova, REVISAO, NADA, comNova))).toEqual(['relatorio_modelagem_tecnica'])
    expect(codigos(travas(MODELAGEM, nova, NADA, comNova))).toEqual(['modelagem'])
  })
})

describe('travasDaIda', () => {
  const processo = (etapa: EtapaDoCatalogo, arquivos?: ArquivosDoProcesso) => ({
    etapaAtual: { id: etapa.id, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, posicao: 1, total: 6 }, arquivos,
  })

  it('usa a etapa atual do processo como origem', () => {
    expect(codigos(travasDaIda(processo(MODELAGEM, NADA), TECNICA, CATALOGO))).toEqual(['modelagem'])
  })

  it('não pergunta para processo sem etapa atual nem sem o que ele tem', () => {
    expect(travasDaIda({ etapaAtual: null, arquivos: NADA }, TECNICA, CATALOGO)).toEqual([])
    expect(travasDaIda(processo(MODELAGEM), TECNICA, CATALOGO)).toEqual([])
  })
})
