import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from '../../cadastros/tipos'
import { AcoesDoCadastro } from './AcoesDoCadastro'
import { FormularioDeSetor } from './FormularioDeSetor'

// Neste ticket o setor ainda não tem macroprocessos; o ticket 04 passa a contá-los no texto.
const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

type SetorEditavelProps = {
  cadastros: ModuloDeCadastros
  setor: Setor
  aoVoltar: () => void
  aoSumir: () => void
  aoMudar: () => void
}

export function SetorEditavel({ cadastros, setor, aoVoltar, aoSumir, aoMudar }: SetorEditavelProps) {
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
      <AcoesDoCadastro ativo={setor.ativo} tituloDaJanela={`Excluir o setor ${setor.sigla}?`}
        textoDaJanela={TEXTO_DA_EXCLUSAO} rotuloDaExclusao="Excluir setor"
        desativar={() => cadastros.desativarSetor(setor.id)} reativar={() => cadastros.reativarSetor(setor.id)}
        excluir={() => cadastros.excluirSetor(setor.id)} aoMudar={aoMudar} aoSumir={aoSumir} aoVoltar={aoVoltar} />
    </div>
  )
}
