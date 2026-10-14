import { useState } from 'react'
import { ehEtapaDoProcesso } from '../../processos/caminhoDeEtapas'
import type { DatasDaEtapa, EtapaDoSetor, UsuarioResponsavel } from '../../processos/tipos'
import { FormularioDeDatas } from './FormularioDeDatas'
import { SeletorDeResponsavel } from './SeletorDeResponsavel'

type EdicaoDaEtapaProps = {
  etapa: EtapaDoSetor
  /** Sem a lista, a etapa não tem responsável (as do setor): só as datas se corrigem. */
  usuarios?: UsuarioResponsavel[]
  aoCorrigirDatas: (datas: DatasDaEtapa) => Promise<void>
  aoEscolherResponsavel: (usuarioId: string | null) => void
  aoSumir: () => void
}

/** O que quem pode alterar faz numa etapa além das ações: corrigir as datas e escolher o responsável. */
export function EdicaoDaEtapa({ etapa, usuarios, aoCorrigirDatas, aoEscolherResponsavel, aoSumir }: EdicaoDaEtapaProps) {
  const [corrigindo, setCorrigindo] = useState(false)

  async function salvar(datas: DatasDaEtapa) {
    await aoCorrigirDatas(datas)
    setCorrigindo(false)
  }

  return (
    <div className="etapa-edicao">
      {usuarios && ehEtapaDoProcesso(etapa) && <SeletorDeResponsavel etapa={etapa} usuarios={usuarios} aoEscolher={aoEscolherResponsavel} />}
      {etapa.status !== 'pendente' && !corrigindo && (
        <button type="button" className="botao botao-secundario" onClick={() => setCorrigindo(true)}>
          Corrigir datas
        </button>
      )}
      {corrigindo && (
        <FormularioDeDatas etapa={etapa} aoSalvar={salvar} aoCancelar={() => setCorrigindo(false)} aoSumir={aoSumir} />
      )}
    </div>
  )
}
