import { ROTULO_DA_FORMA_DE_VER, type FormaDeVer } from '../../processos/enderecoDosProcessos'
import { Icone } from '../Icone'
import { MenuDeAcoes } from '../MenuDeAcoes'

const FORMAS: FormaDeVer[] = ['etapa', 'responsavel', 'setor', 'lista']

type MenuDaFormaDeVerProps = { forma: FormaDeVer; aoEscolher: (forma: FormaDeVer) => void }

/** "Quadro ▾": o botão leva o nome da forma de ver escolhida e abre o menu com as quatro, a atual marcada. */
export function MenuDaFormaDeVer({ forma, aoEscolher }: MenuDaFormaDeVerProps) {
  const itens = FORMAS.map((opcao) => ({
    rotulo: ROTULO_DA_FORMA_DE_VER[opcao], marcado: opcao === forma, aoEscolher: () => aoEscolher(opcao),
  }))
  const conteudo = (
    <>
      <Icone nome={forma === 'lista' ? 'lista' : 'quadro'} tamanho={16} />
      {ROTULO_DA_FORMA_DE_VER[forma]}
      <Icone nome="seta" tamanho={16} />
    </>
  )
  return (
    <MenuDeAcoes rotulo="Forma de ver" grupos={[itens]} paraDireita conteudoDoBotao={conteudo}
      classeDoBotao="botao botao-secundario" />
  )
}
