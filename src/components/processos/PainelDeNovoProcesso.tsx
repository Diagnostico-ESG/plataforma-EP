import type { ModuloDeCadastros } from '../../cadastros/tipos'
import type { DadosDoProcesso, ModuloDeProcessos } from '../../processos/tipos'
import { BotaoFechar } from './CabecalhoDoPainel'
import { fecharComEsc } from './fecharComEsc'
import { FormularioDoProcesso } from './FormularioDoProcesso'
import './Painel.css'

type PainelDeNovoProcessoProps = {
  processos: ModuloDeProcessos
  cadastros: ModuloDeCadastros
  aoFechar: () => void
  aoCriado: () => void
}

/** O cadastro abre no mesmo painel à direita, por cima do Quadro. */
export function PainelDeNovoProcesso({ processos, cadastros, aoFechar, aoCriado }: PainelDeNovoProcessoProps) {
  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoProcesso) {
    await processos.criarProcesso(dados)
    aoCriado()
  }

  return (
    <aside className="painel" aria-label="Painel do novo processo" onKeyDown={fecharComEsc(aoFechar)}>
      <div className="painel-barra"><BotaoFechar aoFechar={aoFechar} /></div>
      <div className="painel-corpo">
        <FormularioDoProcesso cadastros={cadastros} titulo="Cadastrar processo" aoSalvar={criar} aoCancelar={aoFechar} />
      </div>
    </aside>
  )
}
