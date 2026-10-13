import type { Setor } from '../../cadastros/tipos'

type SetorSomenteLeituraProps = { setor: Setor; aoVoltar: () => void }

export function SetorSomenteLeitura({ setor, aoVoltar }: SetorSomenteLeituraProps) {
  return (
    <section className="setor-leitura" aria-label={`Setor ${setor.sigla}`}>
      <h3 className="form-setor-titulo">Setor {setor.sigla}</h3>
      <dl className="setor-leitura-dados">
        <dt>Nome</dt><dd>{setor.nome}</dd>
        <dt>Sigla</dt><dd>{setor.sigla}</dd>
        <dt>Observações</dt><dd>{setor.observacoes ?? '—'}</dd>
      </dl>
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>Voltar à lista</button>
    </section>
  )
}
