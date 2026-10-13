import { useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { DadosDoResponsavel, ModuloDeProcessos, ResponsavelDoSetor } from '../../processos/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { FormularioDeResponsavel } from './FormularioDeResponsavel'
import { TabelaDeResponsaveis } from './TabelaDeResponsaveis'

type Formulario = { tipo: 'novo' } | { tipo: 'editar'; responsavel: ResponsavelDoSetor }

type ResponsaveisEditaveisProps = {
  processos: ModuloDeProcessos
  setorId: string
  responsaveis: ResponsavelDoSetor[]
  aoMudar: () => void
}

/** A lista com Novo, Editar e Excluir (Administrador e Integrante). */
export function ResponsaveisEditaveis({ processos, setorId, responsaveis, aoMudar }: ResponsaveisEditaveisProps) {
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [excluindo, setExcluindo] = useState<ResponsavelDoSetor | null>(null)
  // Responsável que sumiu (excluído por outra pessoa) não é falha: a lista recarrega sem ele.
  const { falha, executar } = useGravacaoComFalha(aoMudar)

  // Outra falha volta ao formulário, que a mostra e guarda os dados.
  async function salvar(dados: DadosDoResponsavel) {
    const editando = formulario?.tipo === 'editar' ? formulario.responsavel : null
    try {
      await (editando ? processos.editarResponsavel(editando.id, dados) : processos.criarResponsavel(setorId, dados))
    } catch (erro) {
      if (!(erro instanceof CadastroInexistente)) throw erro
    }
    setFormulario(null)
    aoMudar()
  }

  // A janela fecha antes de confirmar; o responsável lido aqui é o desta renderização, ainda preenchido.
  function excluir() {
    if (excluindo) executar(() => processos.excluirResponsavel(excluindo.id), aoMudar)
  }

  const editando = formulario?.tipo === 'editar' ? formulario.responsavel : undefined
  return (
    <>
      <TabelaDeResponsaveis responsaveis={responsaveis}
        acoes={{ aoEditar: (responsavel) => setFormulario({ tipo: 'editar', responsavel }), aoExcluir: setExcluindo }} />
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      {formulario
        ? <FormularioDeResponsavel key={editando?.id ?? 'novo'} titulo={editando ? 'Editar responsável' : 'Novo responsável'}
            inicial={editando} aoSalvar={salvar} aoCancelar={() => setFormulario(null)} />
        : <button type="button" className="botao botao-principal cadastros-novo"
            onClick={() => setFormulario({ tipo: 'novo' })}>Novo responsável</button>}
      <JanelaDeConfirmacao aberta={excluindo !== null} titulo={`Excluir o responsável ${excluindo?.nome ?? ''}?`}
        rotuloDaAcao="Excluir responsável" aoConfirmar={excluir} aoFechar={() => setExcluindo(null)} />
    </>
  )
}
