import { useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { DadosDaEtapa, EtapaNoCatalogo, EtapaNova, ModuloDoCatalogo } from '../../processos/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { FormularioDaEtapa, type DadosDoFormularioDaEtapa } from './FormularioDaEtapa'
import { TabelaDoCatalogo } from './TabelaDoCatalogo'

type Formulario = { tipo: 'nova' } | { tipo: 'editar'; etapa: EtapaNoCatalogo }

type CatalogoEditavelProps = { catalogo: ModuloDoCatalogo; etapas: EtapaNoCatalogo[]; aoMudar: () => void }

/** A lista com Nova etapa, Editar, Subir, Descer, Desativar, Reativar e Excluir. */
export function CatalogoEditavel({ catalogo, etapas, aoMudar }: CatalogoEditavelProps) {
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [excluindo, setExcluindo] = useState<EtapaNoCatalogo | null>(null)
  // Etapa que sumiu (excluída por outra pessoa) não é falha: a lista recarrega sem ela.
  const { falha, executar } = useGravacaoComFalha(aoMudar)

  // Outra falha volta ao formulário, que a mostra e guarda os dados.
  async function salvar(dados: DadosDoFormularioDaEtapa) {
    const editando = formulario?.tipo === 'editar' ? formulario.etapa : null
    try {
      await (editando ? catalogo.editarEtapa(editando.id, dadosDaEdicao(dados)) : catalogo.acrescentarEtapa(etapaNova(dados)))
    } catch (erro) {
      if (!(erro instanceof CadastroInexistente)) throw erro
    }
    setFormulario(null)
    aoMudar()
  }

  // A janela fecha antes de confirmar; a etapa lida aqui é a desta renderização, ainda preenchida.
  function excluir() {
    if (excluindo) executar(() => catalogo.excluirEtapa(excluindo.id), aoMudar)
  }

  const editando = formulario?.tipo === 'editar' ? formulario.etapa : undefined
  return (
    <>
      <TabelaDoCatalogo etapas={etapas} acoes={{
        aoEditar: (etapa) => setFormulario({ tipo: 'editar', etapa }),
        aoMover: (etapa, sentido) => executar(() => catalogo.moverEtapa(etapa.id, sentido), aoMudar),
        aoAlternarAtiva: (etapa) => executar(
          () => (etapa.ativa ? catalogo.desativarEtapa(etapa.id) : catalogo.reativarEtapa(etapa.id)), aoMudar),
        aoExcluir: setExcluindo,
      }} />
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      {formulario
        ? <FormularioDaEtapa key={editando?.id ?? 'nova'} titulo={editando ? 'Editar etapa' : 'Nova etapa'}
            inicial={editando} etapas={etapas} aoSalvar={salvar} aoCancelar={() => setFormulario(null)} />
        : <button type="button" className="botao botao-principal cadastros-novo"
            onClick={() => setFormulario({ tipo: 'nova' })}>Nova etapa</button>}
      <JanelaDeConfirmacao aberta={excluindo !== null} titulo={`Excluir a etapa ${excluindo?.nome ?? ''} do catálogo?`}
        rotuloDaAcao="Excluir etapa" aoConfirmar={excluir} aoFechar={() => setExcluindo(null)} />
    </>
  )
}

function dadosDaEdicao({ nome, obrigatoria }: DadosDoFormularioDaEtapa): DadosDaEtapa {
  return { nome, obrigatoria }
}

function etapaNova({ nome, codigo, nivel, obrigatoria, antesDe }: DadosDoFormularioDaEtapa): EtapaNova {
  return { nome, codigo, nivel, obrigatoria, antesDe }
}
