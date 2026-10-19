import type { KeyboardEvent } from 'react'
import { useId } from 'react'
import type { UsuarioResponsavel } from '../../processos/tipos'

/** O valor da opção "Ninguém por enquanto": um id de usuário nunca é vazio. */
export const NINGUEM = ''
const PERGUNTA = 'Quem fica com a próxima etapa?'

type EscolhaDoResponsavelProps = {
  usuarios: UsuarioResponsavel[]
  /** O id marcado; `NINGUEM` marca "Ninguém por enquanto". */
  marcado: string
  aoEscolher: (valor: string) => void
  /** Enter dentro do grupo confirma a escolha. */
  aoConfirmar: () => void
}

/**
 * "Quem fica com a próxima etapa?": um botão de rádio por usuário que pode ser responsável e, por último, "Ninguém
 * por enquanto". Rádios nativos com o mesmo nome: as setas trocam de opção e o leitor de tela lê o grupo pela pergunta.
 */
export function EscolhaDoResponsavel({ usuarios, marcado, aoEscolher, aoConfirmar }: EscolhaDoResponsavelProps) {
  const idDaPergunta = useId()
  const nomeDoGrupo = useId()
  const opcoes = [...usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome })), { valor: NINGUEM, rotulo: 'Ninguém por enquanto' }]

  function aoTeclar(tecla: KeyboardEvent) {
    if (tecla.key !== 'Enter') return
    tecla.preventDefault()
    aoConfirmar()
  }

  return (
    <div role="radiogroup" aria-labelledby={idDaPergunta} className="janela-escolha" onKeyDown={aoTeclar}>
      <span id={idDaPergunta} className="janela-escolha-pergunta">{PERGUNTA}</span>
      {opcoes.map((opcao) => (
        <label key={opcao.valor} className="janela-escolha-opcao">
          <input type="radio" name={nomeDoGrupo} value={opcao.valor} checked={marcado === opcao.valor}
            onChange={() => aoEscolher(opcao.valor)} />
          {opcao.rotulo}
        </label>
      ))}
    </div>
  )
}
