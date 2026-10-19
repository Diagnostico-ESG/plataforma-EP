import { render } from '@testing-library/react'
import App from '../App'
import { AcessoFalso, USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import type { Perfil } from '../acesso/tipos'
import { CadastrosFalso } from '../cadastros/CadastrosFalso'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { hojeLocal } from '../processos/textoDaReuniao'
import type { EtapaDoProcesso, ProcessoLido, UsuarioResponsavel } from '../processos/tipos'
import { VersoesFalso } from '../versoes/VersoesFalso'

export const EU: UsuarioResponsavel = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome }
export const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }

export function etapaDoProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

/** A data (AAAA-MM-DD) de `dias` dias atrás, no relógio de quem usa. */
export function diasAtras(dias: number): string {
  const dia = new Date()
  dia.setDate(dia.getDate() - dias)
  return hojeLocal(dia)
}

export function processoLido(etapas: EtapaDoProcesso[], mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  const atual = etapas.find((etapa) => etapa.status === 'em_andamento' || etapa.status === 'pendente') ?? etapas[0]
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem },
    processoPaiId: null, processoPai: null, subprocessos: [], responsavel: null, origem: 'novo', contexto: null,
    observacoes: null, motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: etapas, ...mudancas,
  }
}

/** O aplicativo inteiro com o processo aberto no verso (endereço #/processos/{id}); `outros` são o pai e os subprocessos. */
export function montarVerso(processo: ProcessoLido, perfil: Perfil = 'integrante_ep', outros: ProcessoLido[] = []): ProcessosFalso {
  window.location.hash = `#/processos/${processo.id}`
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = [processo, ...outros]
  falso.usuariosPossiveis = [EU, BIA]
  falso.etapasDoCatalogo = processo.etapasDoProcesso.map((etapa) => ({
    id: `e${etapa.ordem}`, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, ativa: true,
  }))
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} versoes={new VersoesFalso()} />)
  return falso
}
