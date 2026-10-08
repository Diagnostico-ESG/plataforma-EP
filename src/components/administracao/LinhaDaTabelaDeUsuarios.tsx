import { useState } from 'react'
import type { LinhaDeUsuario, Perfil, SituacaoDoUsuario } from '../../acesso/tipos'
import { Avatar } from '../Avatar'
import { Pilula, type SituacaoPilula } from '../Pilula'
import { CorrecaoDeNome } from './CorrecaoDeNome'
import { PerfilDaLinha } from './PerfilDaLinha'

const ROTULO_DA_SITUACAO: Record<SituacaoDoUsuario, string> = {
  ativo: 'Ativo', inativo: 'Inativo', aguardando: 'Aguardando primeiro acesso',
}
const PILULA_DA_SITUACAO: Record<SituacaoDoUsuario, SituacaoPilula> = {
  ativo: 'aprovado', inativo: 'neutra', aguardando: 'informativa',
}

export type AcoesDaLinha = {
  aoMudarPerfil: (linha: LinhaDeUsuario, perfil: Perfil) => Promise<void>
  aoExcluir: (email: string) => void
  aoDesativar: (id: string) => void
  aoReativar: (id: string) => void
  aoCorrigirNome: (id: string, nome: string) => Promise<void>
}
type LinhaDaTabelaDeUsuariosProps = AcoesDaLinha & { linha: LinhaDeUsuario }

export function LinhaDaTabelaDeUsuarios({ linha, ...acoes }: LinhaDaTabelaDeUsuariosProps) {
  const [corrigindo, setCorrigindo] = useState(false)
  const salvarNome = async (nome: string) => {
    await acoes.aoCorrigirNome(linha.chave, nome)
    setCorrigindo(false)
  }
  return (
    <tr>
      <td>
        {corrigindo
          ? <CorrecaoDeNome email={linha.email} nomeAtual={linha.nome ?? ''} aoSalvar={salvarNome}
              aoCancelar={() => setCorrigindo(false)} />
          : <NomeDaLinha linha={linha} />}
      </td>
      <td>{linha.email}</td>
      <td>
        <PerfilDaLinha email={linha.email} perfilGravado={linha.perfil}
          aoSalvar={(perfil) => acoes.aoMudarPerfil(linha, perfil)} />
      </td>
      <td><Pilula situacao={PILULA_DA_SITUACAO[linha.situacao]}>{ROTULO_DA_SITUACAO[linha.situacao]}</Pilula></td>
      <td><BotoesDaLinha linha={linha} acoes={acoes} aoCorrigirNome={() => setCorrigindo(true)} /></td>
    </tr>
  )
}

function NomeDaLinha({ linha }: { linha: LinhaDeUsuario }) {
  return (
    <span className="tabela-usuarios-nome">
      {linha.nome && <Avatar nome={linha.nome} fotoUrl={linha.fotoUrl ?? undefined} tamanho={24} />}
      {linha.nome ?? '—'}
    </span>
  )
}

type BotoesDaLinhaProps = { linha: LinhaDeUsuario; acoes: AcoesDaLinha; aoCorrigirNome: () => void }

// Quem já entrou não se exclui, só se desativa (ADR 0002).
function BotoesDaLinha({ linha, acoes, aoCorrigirNome }: BotoesDaLinhaProps) {
  if (linha.situacao === 'aguardando') {
    return (
      <button type="button" className="botao botao-secundario" aria-label={`Excluir autorização de ${linha.email}`}
        onClick={() => acoes.aoExcluir(linha.email)}>
        Excluir
      </button>
    )
  }
  const ativo = linha.situacao === 'ativo'
  const acao = ativo ? 'Desativar' : 'Reativar'
  return (
    <span className="tabela-usuarios-acoes">
      <button type="button" className="botao botao-secundario" aria-label={`Corrigir nome de ${linha.email}`}
        onClick={aoCorrigirNome}>
        Corrigir nome
      </button>
      <button type="button" className="botao botao-secundario" aria-label={`${acao} ${linha.email}`}
        onClick={() => (ativo ? acoes.aoDesativar(linha.chave) : acoes.aoReativar(linha.chave))}>
        {acao}
      </button>
    </span>
  )
}
