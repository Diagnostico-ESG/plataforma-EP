import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DadosDoMacroprocesso, Macroprocesso, ModuloDeCadastros } from '../../cadastros/tipos'
import { AcoesDoCadastro } from './AcoesDoCadastro'
import { FormularioDeMacroprocesso } from './FormularioDeMacroprocesso'

// Neste ticket o macroprocesso ainda não tem setores envolvidos; o ticket 04 passa a contá-los no texto.
const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

type MacroprocessoEditavelProps = {
  cadastros: ModuloDeCadastros
  macroprocesso: Macroprocesso
  aoVoltar: () => void
  aoSumir: () => void
  aoMudar: () => void
}

export function MacroprocessoEditavel({ cadastros, macroprocesso, aoVoltar, aoSumir, aoMudar }: MacroprocessoEditavelProps) {
  // A falha comum segue para o formulário, que a mostra e mantém os dados; item excluído por outra pessoa vira o aviso próprio.
  async function salvar(dados: DadosDoMacroprocesso) {
    try {
      await cadastros.editarMacroprocesso(macroprocesso.id, dados)
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      throw erro
    }
    aoVoltar()
  }

  return (
    <div className="cadastros-secao">
      <FormularioDeMacroprocesso titulo={`Macroprocesso ${macroprocesso.nome}`} inicial={macroprocesso}
        rotuloDoCancelar="Voltar à lista" aoSalvar={salvar} aoCancelar={aoVoltar} />
      <AcoesDoCadastro ativo={macroprocesso.ativo} tituloDaJanela={`Excluir o macroprocesso ${macroprocesso.nome}?`}
        textoDaJanela={TEXTO_DA_EXCLUSAO} rotuloDaExclusao="Excluir macroprocesso"
        desativar={() => cadastros.desativarMacroprocesso(macroprocesso.id)}
        reativar={() => cadastros.reativarMacroprocesso(macroprocesso.id)}
        excluir={() => cadastros.excluirMacroprocesso(macroprocesso.id)}
        aoMudar={aoMudar} aoSumir={aoSumir} aoVoltar={aoVoltar} />
    </div>
  )
}
