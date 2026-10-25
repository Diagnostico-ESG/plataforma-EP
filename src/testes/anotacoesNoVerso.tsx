import { act, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'
import { processoLido } from './processoNoVerso'
import { versoAberto } from './versoDoCartao'
import type { ProcessoLido } from '../processos/tipos'

export const processoDasAnotacoes = (mudancas: Partial<ProcessoLido> = {}): ProcessoLido => processoLido(mudancas, 'modelagem')

/** O bloco "Anotações" do verso aberto. */
export const blocoDasAnotacoes = async () => within(await (await versoAberto()).findByRole('region', { name: 'Anotações' }))

export const campoDasAnotacoes = async () => (await blocoDasAnotacoes()).findByRole('textbox', { name: 'Anotações' })

export const digitarNasAnotacoes = async (texto: string) => fireEvent.change(await campoDasAnotacoes(), { target: { value: texto } })

/** Deixa passar a pausa de 1 segundo do salvamento automático (o relógio simulado do Vitest). */
export const passarAPausa = () => act(() => vi.advanceTimersByTimeAsync(1000))
