import { useCallback } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useEndereco } from '../../hooks/useEndereco'
import {
  lerEnderecoDosProcessos, montarEnderecoDosProcessos, type EnderecoDosProcessos,
} from '../../processos/enderecoDosProcessos'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { PainelDeNovoProcesso } from './PainelDeNovoProcesso'
import { PainelDoProcesso } from './PainelDoProcesso'
import { VisaoDosProcessos } from './VisaoDosProcessos'

type AreaDeProcessosProps = {
  usuario: UsuarioAtual; processos: ModuloDeProcessos; cadastros: ModuloDeCadastros
  versoes: ModuloDeVersoes
}

// O foco volta ao cartão (Quadro) ou ao botão da linha (Lista) do processo que estava aberto, depois que a visão deixa de estar inerte.
function focarNoProcesso(id: string) {
  setTimeout(() => (document.getElementById(`cartao-${id}`) ?? document.getElementById(`linha-${id}`))?.focus(), 0)
}

// Esconder botões e o formulário da Consulta é conveniência; quem protege os dados é a RLS de processos.
export function AreaDeProcessos({ usuario, processos, cadastros, versoes }: AreaDeProcessosProps) {
  const listar = useCallback(() => processos.listarProcessos(), [processos])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [endereco, irPara] = useEndereco()
  const atual = lerEnderecoDosProcessos(endereco)
  const podeAlterar = usuario.perfil !== 'consulta'
  const cadastrando = podeAlterar && atual.aberto === 'novo'
  const idAberto = atual.aberto === 'novo' ? null : atual.aberto
  const irParaVisao = (mudancas: Partial<EnderecoDosProcessos>) => irPara(montarEnderecoDosProcessos({ ...atual, ...mudancas }))
  const enderecoDoProcesso = (id: string) => montarEnderecoDosProcessos({ ...atual, aberto: id })

  function fechar() {
    irParaVisao({ aberto: null })
    if (idAberto) focarNoProcesso(idAberto)
  }

  function aoCriar() {
    irParaVisao({ aberto: null })
    recarregar()
  }

  return (
    <section className="area-de-processos" aria-label="Processos">
      <div className={idAberto || cadastrando ? 'quadro-esmaecido' : undefined} inert={idAberto !== null || cadastrando}>
        <VisaoDosProcessos visao={atual.visao} estado={estado} aoTentarDeNovo={tentarDeNovo} podeAlterar={podeAlterar}
          aoCadastrar={() => irParaVisao({ aberto: 'novo' })} idEscolhido={idAberto}
          enderecoDoProcesso={enderecoDoProcesso} aoAbrir={(id) => irParaVisao({ aberto: id })}
          filtros={atual.filtros} aoMudarFiltros={(filtros) => irParaVisao({ filtros, aberto: null })} />
      </div>
      {idAberto && (
        <PainelDoProcesso key={idAberto} processos={processos} cadastros={cadastros} versoes={versoes} id={idAberto}
          podeAlterar={podeAlterar} aoFechar={fechar} aoMudar={recarregar} enderecoDoProcesso={enderecoDoProcesso} />
      )}
      {cadastrando && (
        <PainelDeNovoProcesso processos={processos} cadastros={cadastros} aoFechar={() => irParaVisao({ aberto: null })}
          aoCriado={aoCriar} />
      )}
    </section>
  )
}
