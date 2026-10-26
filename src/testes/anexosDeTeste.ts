import { screen, within } from '@testing-library/react'
import type { Anexo } from '../anexos/tipos'

/** Um anexo inventado, enviado na Modelagem piloto por Ana; `enviadoEm` cresce com o número, como o relógio do banco. */
export function anexoDeTeste(numero: number, nome: string, mudancas: Partial<Anexo> = {}): Anexo {
  const extensao = nome.split('.').pop() ?? 'pdf'
  return {
    id: `an${numero}`, papel: 'anexo', nome, formato: extensao, tamanho: 100 * numero, etapa: 'Modelagem piloto', autor: 'Ana Teste',
    enviadoEm: `2026-10-${String(10 + numero).padStart(2, '0')}T13:00:00Z`, ...mudancas,
  }
}

/** Um arquivo de teste com o tamanho dito, sem alocar os bytes (o navegador só lê o tamanho antes do envio). */
export function arquivoComTamanho(nome: string, tamanho: number): File {
  const arquivo = new File(['x'], nome)
  Object.defineProperty(arquivo, 'size', { value: tamanho })
  return arquivo
}

/** A seção "Outros anexos" do verso aberto. */
export async function secaoDeAnexos() {
  const verso = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  return within(await verso.findByRole('region', { name: 'Outros anexos' }))
}
