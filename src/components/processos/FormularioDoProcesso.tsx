import { useCallback } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { paisPossiveis } from '../../processos/paisPossiveis'
import type { DadosDoProcesso, ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { FormularioPronto } from './FormularioPronto'

type FormularioDoProcessoProps = {
  cadastros: ModuloDeCadastros
  /** De onde vêm os pais possíveis do subprocesso (só no cadastro). */
  processos: ModuloDeProcessos
  titulo: string
  /** Na edição, o processo aberto; sem ele, é o cadastro. */
  inicial?: ProcessoLido
  /** A falha segue para o formulário, que a mostra e mantém os dados. */
  aoSalvar: (dados: DadosDoProcesso) => Promise<void>
  aoCancelar: () => void
}

/** Carrega os setores, os macroprocessos e, no cadastro, os pais possíveis e, com eles, mostra o formulário. */
export function FormularioDoProcesso({ cadastros, processos, ...formulario }: FormularioDoProcessoProps) {
  const cadastrando = !formulario.inicial
  const carregar = useCallback(async () => ({
    setores: await cadastros.listarSetores(), macroprocessos: await cadastros.listarMacroprocessos(),
    pais: cadastrando ? paisPossiveis((await processos.listarProcessos()).processos) : [],
  }), [cadastros, processos, cadastrando])
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando setores e macroprocessos…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os setores e os macroprocessos" aoTentarDeNovo={tentarDeNovo} />
  return <FormularioPronto cadastros={cadastros} opcoes={estado.valor} {...formulario} />
}
