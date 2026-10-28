import type { SetorComMacroprocessos } from '../../cadastros/tipos'
import { SeloDoSetor } from '../SeloDoSetor'
import { MacroprocessosDoSetor } from './MacroprocessosDoSetor'

type SetorSomenteLeituraProps = { setor: SetorComMacroprocessos; aoVoltar: () => void }

export function SetorSomenteLeitura({ setor, aoVoltar }: SetorSomenteLeituraProps) {
  return (
    <section className="setor-leitura" aria-label={`Setor ${setor.sigla}`}>
      <h3 className="form-setor-titulo">Setor {setor.sigla}</h3>
      <dl className="setor-leitura-dados">
        <dt>Nome</dt><dd>{setor.nome}</dd>
        <dt>Sigla</dt><dd><SeloDoSetor sigla={setor.sigla} cor={setor.cor} /></dd>
        <dt>Observações</dt><dd>{setor.observacoes ?? '—'}</dd>
      </dl>
      <MacroprocessosDoSetor macroprocessos={setor.macroprocessos} />
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>Voltar à lista</button>
    </section>
  )
}
