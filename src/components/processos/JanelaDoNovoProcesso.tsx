import './Painel.css'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import type { DadosDoProcesso, ModuloDeProcessos } from '../../processos/tipos'
import { BotaoFecharJanela } from './CabecalhoDoVerso'
import { FormularioDoProcesso } from './FormularioDoProcesso'
import { JanelaDoVerso } from './JanelaDoVerso'

type JanelaDoNovoProcessoProps = {
  processos: ModuloDeProcessos
  cadastros: ModuloDeCadastros
  aoFechar: () => void
  aoCriado: () => void
}

/** O cadastro abre na mesma janela do verso, estreita, por cima do Quadro ou da Lista; Esc e Cancelar fecham. */
export function JanelaDoNovoProcesso({ processos, cadastros, aoFechar, aoCriado }: JanelaDoNovoProcessoProps) {
  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoProcesso) {
    await processos.criarProcesso(dados)
    aoCriado()
  }

  return (
    <JanelaDoVerso rotulo="Novo processo" estreita aoFechar={aoFechar}>
      <div className="verso-barra"><BotaoFecharJanela aoFechar={aoFechar} /></div>
      <div className="verso-pagina">
        <FormularioDoProcesso cadastros={cadastros} processos={processos} titulo="Cadastrar processo" aoSalvar={criar}
          aoCancelar={aoFechar} />
      </div>
    </JanelaDoVerso>
  )
}
