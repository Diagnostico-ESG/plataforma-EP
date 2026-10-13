import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { textoDaExclusaoDoMacroprocesso } from '../../cadastros/textosDeExclusao'
import type { DadosDoMacroprocesso, MacroprocessoComSetores, ModuloDeCadastros } from '../../cadastros/tipos'
import { AcoesDoCadastro } from './AcoesDoCadastro'
import { FormularioDeMacroprocesso } from './FormularioDeMacroprocesso'
import { SetoresEnvolvidos } from './SetoresEnvolvidos'

type MacroprocessoEditavelProps = {
  cadastros: ModuloDeCadastros
  macroprocesso: MacroprocessoComSetores
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
      <SetoresEnvolvidos envolvidos={macroprocesso.setoresEnvolvidos}
        edicao={{ cadastros, macroprocessoId: macroprocesso.id, aoMudar, aoSumir }} />
      <AcoesDoCadastro ativo={macroprocesso.ativo} tituloDaJanela={`Excluir o macroprocesso ${macroprocesso.nome}?`}
        textoDaJanela={textoDaExclusaoDoMacroprocesso(macroprocesso.setoresEnvolvidos.length)} rotuloDaExclusao="Excluir macroprocesso"
        desativar={() => cadastros.desativarMacroprocesso(macroprocesso.id)}
        reativar={() => cadastros.reativarMacroprocesso(macroprocesso.id)}
        excluir={() => cadastros.excluirMacroprocesso(macroprocesso.id)}
        aoMudar={aoMudar} aoSumir={aoSumir} aoVoltar={aoVoltar} />
    </div>
  )
}
