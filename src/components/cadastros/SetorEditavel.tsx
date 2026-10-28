import { useCallback } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DadosDoSetor, ModuloDeCadastros, SetorComMacroprocessos, SetorDaLista } from '../../cadastros/tipos'
import { textoDaExclusaoDoSetor } from '../../cadastros/textosDeExclusao'
import { coresEmUso } from '../../cadastros/corDoSetor'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import { SeloDoSetor } from '../SeloDoSetor'
import { AcoesDoCadastro } from './AcoesDoCadastro'
import { FormularioDeSetor } from './FormularioDeSetor'
import { MacroprocessosDoSetor } from './MacroprocessosDoSetor'

type SetorEditavelProps = {
  cadastros: ModuloDeCadastros
  setor: SetorComMacroprocessos
  aoVoltar: () => void
  aoSumir: () => void
  aoMudar: () => void
}

export function SetorEditavel({ cadastros, setor, aoVoltar, aoSumir, aoMudar }: SetorEditavelProps) {
  const lerSetores = useCallback(() => cadastros.listarSetores(), [cadastros])
  const { estado: setores } = useCarregamento(lerSetores)

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
      <SeloDoSetor sigla={setor.sigla} cor={setor.cor} />
      {/* O formulário não espera a lista de setores: a grade aparece quando ela chega (ou sem as marcas, se falhar). */}
      <FormularioDeSetor titulo={`Setor ${setor.sigla}`} inicial={setor} rotuloDoCancelar="Voltar à lista"
        coresEmUso={setores.tipo === 'carregando' ? undefined : coresDosOutros(setores, setor.id)}
        aoSalvar={salvar} aoCancelar={aoVoltar} />
      <MacroprocessosDoSetor macroprocessos={setor.macroprocessos} />
      <AcoesDoCadastro ativo={setor.ativo} tituloDaJanela={`Excluir o setor ${setor.sigla}?`}
        textoDaJanela={textoDaExclusaoDoSetor(setor.sigla, setor.macroprocessos.length)} rotuloDaExclusao="Excluir setor"
        desativar={() => cadastros.desativarSetor(setor.id)} reativar={() => cadastros.reativarSetor(setor.id)}
        excluir={() => cadastros.excluirSetor(setor.id)} aoMudar={aoMudar} aoSumir={aoSumir} aoVoltar={aoVoltar} />
    </div>
  )
}

// Sem a lista (falha ao ler), a grade aparece sem as marcas de "em uso": escolher continua possível.
function coresDosOutros(setores: EstadoDoCarregamento<SetorDaLista[]>, idDoAberto: string) {
  if (setores.tipo !== 'pronto') return coresEmUso([])
  return coresEmUso(setores.valor.filter((outro) => outro.id !== idDoAberto))
}
