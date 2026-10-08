import { rotuloDoPerfil } from '../../acesso/perfis'
import type { LinhaDeUsuario, Perfil, SituacaoDoUsuario } from '../../acesso/tipos'
import type { EstadoDaLista } from '../../hooks/useUsuarios'
import { Avatar } from '../Avatar'
import { Pilula, type SituacaoPilula } from '../Pilula'
import { SeletorDePerfil } from './SeletorDePerfil'

const ROTULO_DA_SITUACAO: Record<SituacaoDoUsuario, string> = {
  ativo: 'Ativo', inativo: 'Inativo', aguardando: 'Aguardando primeiro acesso',
}
const PILULA_DA_SITUACAO: Record<SituacaoDoUsuario, SituacaoPilula> = {
  ativo: 'aprovado', inativo: 'neutra', aguardando: 'informativa',
}
const LINHAS_FANTASMA = 3

type AcoesDaLinha = {
  aoMudarPerfil: (email: string, perfil: Perfil) => void
  aoExcluir: (email: string) => void
}
type ListaDeUsuariosProps = AcoesDaLinha & { lista: EstadoDaLista; aoTentarDeNovo: () => void }

export function ListaDeUsuarios({ lista, aoTentarDeNovo, ...acoes }: ListaDeUsuariosProps) {
  if (lista.tipo === 'erro') {
    return (
      <div className="administracao-erro" role="alert">
        <p>Não foi possível carregar os usuários. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  return (
    <table className="tabela-usuarios" aria-busy={lista.tipo === 'carregando'}>
      {lista.tipo === 'carregando' && <caption>Carregando usuários…</caption>}
      <thead>
        <tr>
          <th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th>
          <th scope="col">Situação</th><th scope="col"><span className="visualmente-oculto">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        {lista.tipo === 'carregando'
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : lista.linhas.map((linha) => <LinhaDaTabela key={linha.chave} linha={linha} {...acoes} />)}
      </tbody>
    </table>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => <td key={i}><span className="fantasma-barra" /></td>)}
    </tr>
  )
}

// Neste ticket só a autorização aguardando tem ações; as de usuário que já entrou vêm no ticket 03.
function LinhaDaTabela({ linha, aoMudarPerfil, aoExcluir }: AcoesDaLinha & { linha: LinhaDeUsuario }) {
  const aguardando = linha.situacao === 'aguardando'
  return (
    <tr>
      <td>
        <span className="tabela-usuarios-nome">
          {linha.nome && <Avatar nome={linha.nome} fotoUrl={linha.fotoUrl ?? undefined} tamanho={24} />}
          {linha.nome ?? '—'}
        </span>
      </td>
      <td>{linha.email}</td>
      <td>
        {aguardando
          ? <SeletorDePerfil rotulo={`Perfil de ${linha.email}`} valor={linha.perfil}
              aoMudar={(perfil) => aoMudarPerfil(linha.email, perfil)} />
          : rotuloDoPerfil(linha.perfil)}
      </td>
      <td><Pilula situacao={PILULA_DA_SITUACAO[linha.situacao]}>{ROTULO_DA_SITUACAO[linha.situacao]}</Pilula></td>
      <td>
        {aguardando && (
          <button type="button" className="botao botao-secundario" aria-label={`Excluir autorização de ${linha.email}`}
            onClick={() => aoExcluir(linha.email)}>
            Excluir
          </button>
        )}
      </td>
    </tr>
  )
}
