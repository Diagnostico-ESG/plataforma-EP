import { describe, expect, it } from 'vitest'
import { primeiraTravaQueFalta } from './travaDeArquivos'
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

function trava(de: EtapaDoCatalogo, para: EtapaDoCatalogo, arquivos?: ArquivosDoProcesso, catalogo = CATALOGO) {
  return primeiraTravaQueFalta({ de, para, catalogo, arquivos })
}

describe('primeiraTravaQueFalta', () => {
  it('não trava quando a tela não sabe o que o processo tem', () => {
    expect(trava(MODELAGEM, TECNICA)).toBeNull()
  })

  it('pede a versão piloto ao sair da Modelagem piloto', () => {
    expect(trava(MODELAGEM, TECNICA, NADA)).toEqual({ codigo: 'modelagem', nome: 'Modelagem piloto', falta: ['versao_piloto'] })
  })

  it('aceita a versão em sequência no lugar da piloto, que já não pode entrar depois dela', () => {
    expect(trava(MODELAGEM, TECNICA, { ...NADA, versaoEmSequencia: true })).toBeNull()
  })

  it('pede a versão e o relatório ao sair da técnica, dizendo só o que falta', () => {
    expect(trava(TECNICA, REVISAO, { ...NADA, versaoPiloto: true })?.falta).toEqual(['versao', 'relatorio'])
    expect(trava(TECNICA, REVISAO, { ...NADA, versaoEmSequencia: true })?.falta).toEqual(['relatorio'])
    expect(trava(TECNICA, REVISAO, { ...NADA, relatorioNumerado: true })?.falta).toEqual(['versao'])
  })

  it('deixa sair da técnica com a versão e o relatório, ligados ou não', () => {
    expect(trava(TECNICA, REVISAO, { versaoPiloto: false, versaoEmSequencia: true, relatorioNumerado: true })).toBeNull()
  })

  it('passando por cima das duas etapas confere primeiro a Modelagem piloto e depois a técnica', () => {
    expect(trava(NAO_INICIADOS, CONCLUIDOS, NADA)?.codigo).toBe('modelagem')
    expect(trava(NAO_INICIADOS, CONCLUIDOS, { ...NADA, versaoPiloto: true })).toEqual({
      codigo: 'relatorio_modelagem_tecnica', nome: 'Relatório e modelagem técnica', falta: ['versao', 'relatorio'],
    })
  })

  it('não trava voltar, a mesma etapa nem o processo que já estava adiante', () => {
    expect(trava(REVISAO, MODELAGEM, NADA)).toBeNull()
    expect(trava(TECNICA, TECNICA, NADA)).toBeNull()
    expect(trava(REVISAO, VALIDACAO, NADA)).toBeNull()
    expect(trava(CONCLUIDOS, REVISAO, NADA)).toBeNull()
  })

  it('não trava ao chegar na etapa com trava, só ao sair dela', () => {
    expect(trava(NAO_INICIADOS, MODELAGEM, NADA)).toBeNull()
    expect(trava(MODELAGEM, TECNICA, { ...NADA, versaoPiloto: true })).toBeNull()
  })

  it('ignora a etapa com trava desativada no catálogo', () => {
    const semModelagem = CATALOGO.map((e) => (e.codigo === 'modelagem' ? { ...e, ativa: false } : e))
    expect(trava(NAO_INICIADOS, REVISAO, NADA, semModelagem)?.codigo).toBe('relatorio_modelagem_tecnica')
    const semAsDuas = semModelagem.map((e) => (e.codigo === TECNICA.codigo ? { ...e, ativa: false } : e))
    expect(trava(NAO_INICIADOS, CONCLUIDOS, NADA, semAsDuas)).toBeNull()
  })

  it('segue a ordem do catálogo quando uma etapa nova entra entre as duas', () => {
    const nova = etapa(2.5, 'etapa_nova', 'Etapa nova')
    const comNova = [...CATALOGO, nova]
    expect(trava(nova, REVISAO, NADA, comNova)?.codigo).toBe('relatorio_modelagem_tecnica')
    expect(trava(MODELAGEM, nova, NADA, comNova)?.codigo).toBe('modelagem')
  })
})
