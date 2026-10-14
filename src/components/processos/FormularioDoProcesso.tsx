import { useCallback } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { DadosDoProcesso, ProcessoLido } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { FormularioPronto } from './FormularioPronto'

type FormularioDoProcessoProps = {
  cadastros: ModuloDeCadastros
  titulo: string
  /** Na edição, o processo aberto; sem ele, é o cadastro. */
  inicial?: ProcessoLido
  /** A falha segue para o formulário, que a mostra e mantém os dados. */
  aoSalvar: (dados: DadosDoProcesso) => Promise<void>
  aoCancelar: () => void
}

/** Carrega os setores e os macroprocessos para escolher e, com eles, mostra o formulário. */
export function FormularioDoProcesso({ cadastros, ...formulario }: FormularioDoProcessoProps) {
  const carregar = useCallback(
    async () => ({ setores: await cadastros.listarSetores(), macroprocessos: await cadastros.listarMacroprocessos() }),
    [cadastros],
  )
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando setores e macroprocessos…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os setores e os macroprocessos" aoTentarDeNovo={tentarDeNovo} />
  return <FormularioPronto cadastros={cadastros} opcoes={estado.valor} {...formulario} />
}
