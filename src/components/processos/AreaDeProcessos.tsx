import { useCallback } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useEndereco } from '../../hooks/useEndereco'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { PainelDeNovoProcesso } from './PainelDeNovoProcesso'
import { PainelDoProcesso } from './PainelDoProcesso'
import { QuadroDeProcessos } from './QuadroDeProcessos'

type AreaDeProcessosProps = { usuario: UsuarioAtual; processos: ModuloDeProcessos; cadastros: ModuloDeCadastros }

// O segundo trecho do endereço (#/processos/<id>) é o processo escolhido; "novo" e "lista" não são ids.
function idDoEndereco(endereco: string): string | null {
  const trecho = endereco.split('/')[2]
  return trecho && trecho !== 'novo' && trecho !== 'lista' ? trecho : null
}

// Esconder botões e o formulário da Consulta é conveniência; quem protege os dados é a RLS de processos.
export function AreaDeProcessos({ usuario, processos, cadastros }: AreaDeProcessosProps) {
  const listar = useCallback(() => processos.listarProcessos(), [processos])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [endereco, irPara] = useEndereco()
  const podeAlterar = usuario.perfil !== 'consulta'
  const idAberto = idDoEndereco(endereco)
  const cadastrando = podeAlterar && endereco.split('/')[2] === 'novo'

  // O foco volta ao cartão do processo que estava aberto, depois que o Quadro deixa de estar inerte.
  function fechar() {
    irPara('#/processos')
    setTimeout(() => document.getElementById(`cartao-${idAberto}`)?.focus(), 0)
  }

  function aoCriar() {
    irPara('#/processos')
    recarregar()
  }

  return (
    <section className="area-de-processos" aria-label="Processos">
      <div className={idAberto || cadastrando ? 'quadro-esmaecido' : undefined} inert={idAberto !== null || cadastrando}>
        <QuadroDeProcessos estado={estado} aoTentarDeNovo={tentarDeNovo} podeAlterar={podeAlterar}
          aoCadastrar={() => irPara('#/processos/novo')} idEscolhido={idAberto} />
      </div>
      {idAberto && (
        <PainelDoProcesso key={idAberto} processos={processos} cadastros={cadastros} id={idAberto}
          podeAlterar={podeAlterar} aoFechar={fechar} aoMudar={recarregar} />
      )}
      {cadastrando && (
        <PainelDeNovoProcesso processos={processos} cadastros={cadastros} aoFechar={() => irPara('#/processos')}
          aoCriado={aoCriar} />
      )}
    </section>
  )
}
