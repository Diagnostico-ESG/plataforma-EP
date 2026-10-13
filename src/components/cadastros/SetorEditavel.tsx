import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from '../../cadastros/tipos'
import { FormularioDeSetor } from './FormularioDeSetor'

type SetorEditavelProps = {
  cadastros: ModuloDeCadastros
  setor: Setor
  aoVoltar: () => void
  aoSumir: () => void
}

export function SetorEditavel({ cadastros, setor, aoVoltar, aoSumir }: SetorEditavelProps) {
  // A falha comum segue para o formulário, que a mostra e mantém os dados; setor excluído por outra pessoa vira o aviso próprio.
  async function salvar(dados: DadosDoSetor) {
    try {
      await cadastros.editarSetor(setor.id, dados)
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      throw erro
    }
    aoVoltar()
  }

  return (
    <div className="cadastros-secao">
      <FormularioDeSetor titulo={`Setor ${setor.sigla}`} inicial={setor} rotuloDoCancelar="Voltar à lista"
        aoSalvar={salvar} aoCancelar={aoVoltar} />
    </div>
  )
}
