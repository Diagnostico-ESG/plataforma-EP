import { useCallback, useState } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useEndereco } from '../../hooks/useEndereco'
import { ContextoDoTirarDoQuadro, useTirarDoQuadro } from '../../hooks/useTirarDoQuadro'
import {
  lerEnderecoDosProcessos, montarEnderecoDosProcessos, SEM_FILTROS, type EnderecoDosProcessos,
} from '../../processos/enderecoDosProcessos'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { AvisoDoQuadro } from './AvisoDoQuadro'
import { JanelaDoNovoProcesso } from './JanelaDoNovoProcesso'
import { VersoDoCartao } from './VersoDoCartao'
import { VisaoDosProcessos } from './VisaoDosProcessos'

type AreaDeProcessosProps = {
  usuario: UsuarioAtual; processos: ModuloDeProcessos; cadastros: ModuloDeCadastros
  versoes: ModuloDeVersoes
  revisoes: ModuloDeRevisoes
}

// O foco volta ao cartão (Quadro) ou ao botão da linha (Lista) do processo que estava aberto, depois que a visão deixa de estar inerte.
function focarNoProcesso(id: string) {
  setTimeout(() => (document.getElementById(`cartao-${id}`) ?? document.getElementById(`linha-${id}`))?.focus(), 0)
}

// Esconder botões e o formulário da Consulta é conveniência; quem protege os dados é a RLS de processos.
export function AreaDeProcessos({ usuario, processos, cadastros, versoes, revisoes }: AreaDeProcessosProps) {
  const listar = useCallback(() => processos.listarProcessos(), [processos])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [endereco, irPara] = useEndereco()
  const atual = lerEnderecoDosProcessos(endereco)
  const podeAlterar = usuario.perfil !== 'consulta'
  const [recemCriado, setRecemCriado] = useState<string | null>(null)
  const cadastrando = podeAlterar && atual.aberto === 'novo'
  const idAberto = atual.aberto === 'novo' ? null : atual.aberto
  const irParaVisao = (mudancas: Partial<EnderecoDosProcessos>, substituir = false) => irPara(montarEnderecoDosProcessos({ ...atual, ...mudancas }), substituir)
  const enderecoDoProcesso = (id: string) => montarEnderecoDosProcessos({ ...atual, aberto: id })
  // Situação e busca só existem na Lista: o Quadro não as tem, e a Lista abre em Concluídos com os mesmos filtros dele.
  const enderecoDosConcluidosNaLista = montarEnderecoDosProcessos({
    visao: 'lista', aberto: null, filtros: { ...atual.filtros, situacao: null, busca: null }, agrupar: 'etapa', mostrar: 'concluidos',
  })
  const tirada = useTirarDoQuadro(processos, recarregar)

  function fechar() {
    setRecemCriado(null)
    irParaVisao({ aberto: null })
    if (idAberto) focarNoProcesso(idAberto)
  }

  // O verso do processo recém-criado abre com o aviso; abrir outro (ou reabrir este depois) não o repete.
  function aoCriar(idCriado: string) {
    setRecemCriado(idCriado)
    irParaVisao({ aberto: idCriado })
    recarregar()
  }

  return (
    <ContextoDoTirarDoQuadro.Provider value={podeAlterar ? tirada.tirar : null}>
    <section className="area-de-processos" aria-label="Processos">
      <AvisoDoQuadro aviso={tirada.aviso} falha={tirada.falha} aoDesfazer={tirada.desfazer} aoFechar={tirada.fechar} />
      {/* O fundo da janela (::backdrop) já escurece a visão; o inert a tira do Tab e do leitor de tela. */}
      <div inert={idAberto !== null || cadastrando}>
        <VisaoDosProcessos visao={atual.visao} estado={estado} aoTentarDeNovo={tentarDeNovo} podeAlterar={podeAlterar}
          aoCadastrar={() => irParaVisao({ aberto: 'novo' })} idEscolhido={idAberto}
          enderecoDoProcesso={enderecoDoProcesso} aoAbrir={(id) => irParaVisao({ aberto: id })}
          filtros={atual.filtros} aoMudarFiltros={(filtros) => irParaVisao({ filtros, aberto: null }, filtros.busca !== atual.filtros.busca)}
          agrupar={atual.agrupar} aoMudarAgrupar={(agrupar) => irParaVisao({ agrupar, aberto: null })}
          enderecoDosConcluidosNaLista={enderecoDosConcluidosNaLista} mostrar={atual.mostrar} aoLimparTudo={() => irParaVisao({ filtros: SEM_FILTROS, mostrar: 'todos', aberto: null })}
          aoMudarMostrar={(mostrar) => irParaVisao({ mostrar, filtros: { ...atual.filtros, situacao: null }, aberto: null })}
          ordenacao={atual.ordenacao} aoOrdenar={(ordenacao) => irParaVisao({ ordenacao, aberto: null })}
          processos={processos} versoes={versoes} usuarioId={usuario.id} aoMudar={recarregar} />
      </div>
      {idAberto && (
        <VersoDoCartao processos={processos} cadastros={cadastros} versoes={versoes} revisoes={revisoes} id={idAberto}
          podeAlterar={podeAlterar} usuarioId={usuario.id} aoFechar={fechar}
          aviso={recemCriado === idAberto ? 'Processo cadastrado' : undefined} aoMudar={recarregar} enderecoDoProcesso={enderecoDoProcesso} />
      )}
      {cadastrando && (
        <JanelaDoNovoProcesso processos={processos} cadastros={cadastros} aoFechar={() => irParaVisao({ aberto: null })}
          aoCriado={aoCriar} />
      )}
    </section>
    </ContextoDoTirarDoQuadro.Provider>
  )
}
