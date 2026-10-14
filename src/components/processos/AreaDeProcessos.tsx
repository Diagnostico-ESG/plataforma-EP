import { useCallback } from 'react'
import type { UsuarioAtual } from '../../acesso/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useEndereco } from '../../hooks/useEndereco'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { QuadroDeProcessos } from './QuadroDeProcessos'

type AreaDeProcessosProps = { usuario: UsuarioAtual; processos: ModuloDeProcessos }

// O segundo trecho do endereço (#/processos/<id>) é o processo escolhido; "novo" e "lista" não são ids.
function idDoEndereco(endereco: string): string | null {
  const trecho = endereco.split('/')[2]
  return trecho && trecho !== 'novo' && trecho !== 'lista' ? trecho : null
}

// Esconder botões da Consulta é conveniência; quem protege os dados é a RLS de processos.
export function AreaDeProcessos({ usuario, processos }: AreaDeProcessosProps) {
  const listar = useCallback(() => processos.listarProcessos(), [processos])
  const { estado, tentarDeNovo } = useCarregamento(listar)
  const [endereco, irPara] = useEndereco()
  return (
    <section className="area-de-processos" aria-label="Processos">
      <QuadroDeProcessos estado={estado} aoTentarDeNovo={tentarDeNovo} podeAlterar={usuario.perfil !== 'consulta'}
        aoCadastrar={() => irPara('#/processos/novo')} idEscolhido={idDoEndereco(endereco)} />
    </section>
  )
}
