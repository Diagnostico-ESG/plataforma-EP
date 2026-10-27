import { fireEvent, screen, within } from '@testing-library/react'
import type { ArquivosDoProcesso } from '../processos/tipos'
import { type Montagem, montarNosCadastros, naEtapa } from './processosNosCadastros'
import { agoraDoVerso } from './versoDoCartao'

// Apoio dos testes da Confirmação de arquivos (travas-em-avisos): o verso do p1 numa etapa, com o que ele tem de arquivos.

export const NADA: ArquivosDoProcesso = { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false }

export function montarVerso(etapa: string, arquivos: ArquivosDoProcesso, mais: Montagem = {}) {
  return montarNosCadastros({
    ...mais,
    ajustarProcessos: (falso) => {
      naEtapa(etapa)(falso)
      falso.processos = falso.processos.map((processo) => (processo.id === 'p1' ? { ...processo, arquivos } : processo))
      mais.ajustarProcessos?.(falso)
    },
  })
}

export const irPara = async (id: string) => fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }), { target: { value: id } })
export const janela = async (nome: string) => within(await screen.findByRole('dialog', { name: nome }))
