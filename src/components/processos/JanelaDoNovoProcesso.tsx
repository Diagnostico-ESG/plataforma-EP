import './Painel.css'
import { useEffect, useRef } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import type { DadosDoProcesso, ModuloDeProcessos } from '../../processos/tipos'
import { CabecalhoDoFormulario } from './CabecalhoDoFormulario'
import { FormularioDoProcesso } from './FormularioDoProcesso'
import { JanelaDoVerso } from './JanelaDoVerso'

type JanelaDoNovoProcessoProps = {
  processos: ModuloDeProcessos
  cadastros: ModuloDeCadastros
  aoFechar: () => void
  /** Recebe o id do processo criado. */
  aoCriado: (id: string) => void
}

/** O cadastro abre na mesma janela do verso, estreita, por cima do Quadro ou da Lista; Esc e Cancelar fecham. */
export function JanelaDoNovoProcesso({ processos, cadastros, aoFechar, aoCriado }: JanelaDoNovoProcessoProps) {
  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoProcesso) {
    aoCriado(await processos.criarProcesso(dados))
  }
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => titulo.current?.focus({ preventScroll: true }), [])

  return (
    <JanelaDoVerso rotulo="Novo processo" estreita aoFechar={aoFechar}>
      <CabecalhoDoFormulario titulo="Novo processo" referencia={titulo} aoFechar={aoFechar} />
      <div className="verso-pagina">
        <FormularioDoProcesso cadastros={cadastros} processos={processos} titulo="Cadastrar processo" aoSalvar={criar}
          aoCancelar={aoFechar} />
      </div>
    </JanelaDoVerso>
  )
}
