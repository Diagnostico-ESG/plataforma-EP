import type { ModeloDaReuniao } from '../../reunioes/enderecoDasReunioes'
import type { DadosDaReuniao, ModuloDeReunioes } from '../../reunioes/tipos'
import { BotaoFechar } from '../processos/CabecalhoDoPainel'
import { fecharComEsc } from '../processos/fecharComEsc'
import '../processos/Painel.css'
import { FormularioDaReuniao } from './FormularioDaReuniao'

type PainelDeNovaReuniaoProps = {
  reunioes: ModuloDeReunioes
  /** O que já vem preenchido (registro vindo do setor ou do processo). */
  modelo: ModeloDaReuniao | null
  aoFechar: () => void
  aoRegistrada: () => void
}

/** O registro abre no mesmo painel à direita, por cima da lista. */
export function PainelDeNovaReuniao({ reunioes, modelo, aoFechar, aoRegistrada }: PainelDeNovaReuniaoProps) {
  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function registrar(dados: DadosDaReuniao) {
    await reunioes.salvarReuniao(null, dados)
    aoRegistrada()
  }

  return (
    <aside className="painel" aria-label="Painel da nova reunião" onKeyDown={fecharComEsc(aoFechar)}>
      <div className="painel-barra"><BotaoFechar aoFechar={aoFechar} /></div>
      <div className="painel-corpo">
        <FormularioDaReuniao reunioes={reunioes} titulo="Registrar reunião" modelo={modelo} aoSalvar={registrar}
          aoCancelar={aoFechar} />
      </div>
    </aside>
  )
}
