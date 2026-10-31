import type { UsuarioAtual } from '../../acesso/tipos'
import { Icone, type NomeIcone } from '../Icone'
import { BotaoEmBreve } from './BotaoEmBreve'
import { MenuDaConta } from './MenuDaConta'

type BarraSuperiorProps = {
  titulo: string
  /** O ícone da tela, em azul ao lado do título. */
  icone: NomeIcone
  usuario: UsuarioAtual
  aoSair: () => Promise<void>
}

// A forma de ver os processos saiu daqui para o "Quadro ▾" da faixa de controles; busca e sino ainda não fazem nada.
export function BarraSuperior({ titulo, icone, usuario, aoSair }: BarraSuperiorProps) {
  return (
    <header className="barra-superior">
      <span className="barra-icone"><Icone nome={icone} tamanho={20} /></span>
      <h1 className="barra-titulo">{titulo}</h1>
      <div className="barra-acoes">
        <BotaoEmBreve rotulo="Buscar" icone="lupa" />
        <BotaoEmBreve rotulo="Notificações" icone="sino" />
        <MenuDaConta usuario={usuario} aoSair={aoSair} />
      </div>
    </header>
  )
}
