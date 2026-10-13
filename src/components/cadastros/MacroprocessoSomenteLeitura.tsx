import { rotuloDaCategoria } from '../../cadastros/categorias'
import type { MacroprocessoComSetores } from '../../cadastros/tipos'
import { SetoresEnvolvidos } from './SetoresEnvolvidos'

const SEM_VALOR = '—'

type MacroprocessoSomenteLeituraProps = { macroprocesso: MacroprocessoComSetores; aoVoltar: () => void }

export function MacroprocessoSomenteLeitura({ macroprocesso, aoVoltar }: MacroprocessoSomenteLeituraProps) {
  return (
    <section className="setor-leitura" aria-label={`Macroprocesso ${macroprocesso.nome}`}>
      <h3 className="form-setor-titulo">Macroprocesso {macroprocesso.nome}</h3>
      <dl className="setor-leitura-dados">
        <dt>Código</dt><dd>{macroprocesso.codigo ?? SEM_VALOR}</dd>
        <dt>Nome</dt><dd>{macroprocesso.nome}</dd>
        <dt>Descrição</dt><dd>{macroprocesso.descricao ?? SEM_VALOR}</dd>
        <dt>Categoria</dt><dd>{rotuloDaCategoria(macroprocesso.categoria)}</dd>
      </dl>
      <SetoresEnvolvidos envolvidos={macroprocesso.setoresEnvolvidos} />
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>Voltar à lista</button>
    </section>
  )
}
