import { useCallback } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useEndereco } from '../../hooks/useEndereco'
import {
  type EnderecoDasReunioes, lerEnderecoDasReunioes, montarEnderecoDasReunioes,
} from '../../reunioes/enderecoDasReunioes'
import { hojeLocal } from '../../reunioes/quandoAcontece'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import '../processos/Quadro.css'
import { PainelDaReuniao } from './PainelDaReuniao'
import { PainelDeNovaReuniao } from './PainelDeNovaReuniao'
import './Reunioes.css'
import { VisaoDasReunioes } from './VisaoDasReunioes'

type AreaDeReunioesProps = { usuario: UsuarioAtual; reunioes: ModuloDeReunioes }

// O foco volta ao botão da linha da reunião que estava aberta, depois que a lista deixa de estar inerte.
function focarNaReuniao(id: string) {
  setTimeout(() => document.getElementById(`linha-reuniao-${id}`)?.focus(), 0)
}

// Esconder o botão de registrar da Consulta é conveniência; quem protege os dados é a RLS de reuniões.
export function AreaDeReunioes({ usuario, reunioes }: AreaDeReunioesProps) {
  const listar = useCallback(() => reunioes.listarReunioes(), [reunioes])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [endereco, irPara] = useEndereco()
  const atual = lerEnderecoDasReunioes(endereco)
  const podeAlterar = usuario.perfil !== 'consulta'
  const registrando = podeAlterar && atual.aberto === 'nova'
  const idAberto = atual.aberto === 'nova' ? null : atual.aberto
  const irParaLista = (mudancas: Partial<EnderecoDasReunioes>) => irPara(montarEnderecoDasReunioes({ ...atual, ...mudancas }))

  function fechar() {
    irParaLista({ aberto: null })
    if (idAberto) focarNaReuniao(idAberto)
  }

  function aoRegistrar() {
    irParaLista({ aberto: null })
    recarregar()
  }

  return (
    <section className="area-de-processos area-de-reunioes" aria-label="Reuniões">
      <div className={idAberto || registrando ? 'quadro-esmaecido' : undefined} inert={idAberto !== null || registrando}>
        <VisaoDasReunioes estado={estado} hoje={hojeLocal()} aoTentarDeNovo={tentarDeNovo} podeAlterar={podeAlterar}
          aoRegistrar={() => irParaLista({ aberto: 'nova' })} idEscolhido={idAberto}
          aoAbrir={(id) => irParaLista({ aberto: id })} filtros={atual.filtros}
          aoMudarFiltros={(filtros) => irParaLista({ filtros, aberto: null })} />
      </div>
      {idAberto && (
        <PainelDaReuniao key={idAberto} reunioes={reunioes} id={idAberto} podeAlterar={podeAlterar} aoFechar={fechar}
          aoMudar={recarregar} />
      )}
      {registrando && <PainelDeNovaReuniao reunioes={reunioes} aoFechar={() => irParaLista({ aberto: null })} aoRegistrada={aoRegistrar} />}
    </section>
  )
}
