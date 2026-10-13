import { type Ref, useEffect, useRef, useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import type { LinhaDeUsuario, Perfil, SituacaoDoUsuario } from '../../acesso/tipos'
import { Avatar } from '../Avatar'
import { Pilula, type SituacaoPilula } from '../Pilula'
import { CorrecaoDeNome } from './CorrecaoDeNome'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { PerfilDaLinha } from './PerfilDaLinha'

const ROTULO_DA_SITUACAO: Record<SituacaoDoUsuario, string> = {
  ativo: 'Ativo', inativo: 'Inativo', aguardando: 'Aguardando primeiro acesso',
}
const PILULA_DA_SITUACAO: Record<SituacaoDoUsuario, SituacaoPilula> = {
  ativo: 'aprovado', inativo: 'neutra', aguardando: 'informativa',
}

export type AcoesDaLinha = {
  aoMudarPerfil: (linha: LinhaDeUsuario, perfil: Perfil) => Promise<void>
  aoExcluir: (email: string) => Promise<void>
  aoDesativar: (id: string) => Promise<void>
  aoReativar: (id: string) => Promise<void>
  aoCorrigirNome: (id: string, nome: string) => Promise<void>
}
type LinhaDaTabelaDeUsuariosProps = AcoesDaLinha & { linha: LinhaDeUsuario }

export function LinhaDaTabelaDeUsuarios({ linha, ...acoes }: LinhaDaTabelaDeUsuariosProps) {
  const [corrigindo, setCorrigindo] = useState(false)
  const botaoCorrigir = useRef<HTMLButtonElement>(null)
  const jaCorrigiu = useRef(false)
  // O formulário do nome some ao salvar ou cancelar; o foco volta ao "Corrigir nome" em vez de cair no topo.
  useEffect(() => {
    if (corrigindo) jaCorrigiu.current = true
    else if (jaCorrigiu.current) botaoCorrigir.current?.focus()
  }, [corrigindo])
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
      <td><BotoesDaLinha linha={linha} acoes={acoes} aoCorrigirNome={() => setCorrigindo(true)} refCorrigir={botaoCorrigir} /></td>
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

type BotoesDaLinhaProps = {
  linha: LinhaDeUsuario
  acoes: AcoesDaLinha
  aoCorrigirNome: () => void
  refCorrigir: Ref<HTMLButtonElement>
}

// A falha de Excluir, Desativar ou Reativar aparece na própria linha, junto da pessoa afetada (spec, ADR 0003).
function BotoesDaLinha(props: BotoesDaLinhaProps) {
  const [falha, setFalha] = useState<string | null>(null)
  const executar = (alteracao: () => Promise<void>) => {
    setFalha(null)
    alteracao().catch((erro: unknown) => setFalha(textoDaFalha(erro)))
  }
  return (
    <span className="tabela-usuarios-acoes">
      <AcoesDaSituacao {...props} executar={executar} />
      {falha && <p className="administracao-falha" role="alert">{falha}</p>}
    </span>
  )
}

type AcoesDaSituacaoProps = BotoesDaLinhaProps & { executar: (alteracao: () => Promise<void>) => void }

// Quem já entrou não se exclui, só se desativa (ADR 0002).
function AcoesDaSituacao({ linha, acoes, aoCorrigirNome, refCorrigir, executar }: AcoesDaSituacaoProps) {
  if (linha.situacao === 'aguardando') {
    return <BotaoExcluirAutorizacao email={linha.email} aoExcluir={() => executar(() => acoes.aoExcluir(linha.email))} />
  }
  return (
    <>
      <button ref={refCorrigir} type="button" className="botao botao-secundario" aria-label={`Corrigir nome de ${linha.email}`}
        onClick={aoCorrigirNome}>
        Corrigir nome
      </button>
      {linha.situacao === 'ativo'
        ? <BotaoDesativar linha={linha} aoDesativar={() => executar(() => acoes.aoDesativar(linha.chave))} />
        : (
          <button type="button" className="botao botao-secundario" aria-label={`Reativar ${linha.email}`}
            onClick={() => executar(() => acoes.aoReativar(linha.chave))}>
            Reativar
          </button>
        )}
    </>
  )
}

// Excluir e Desativar tiram acesso: pedem confirmação (ADR 0003). Reativar é o desfazer e vai direto.
function BotaoExcluirAutorizacao({ email, aoExcluir }: { email: string; aoExcluir: () => void }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <>
      <button type="button" className="botao botao-secundario" aria-label={`Excluir autorização de ${email}`}
        onClick={() => setConfirmando(true)}>
        Excluir
      </button>
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Excluir a autorização de ${email}?`}
        texto="A pessoa não conseguirá entrar. Para permitir de novo, autorize o e-mail outra vez."
        rotuloDaAcao="Excluir autorização" aoConfirmar={aoExcluir} aoFechar={() => setConfirmando(false)} />
    </>
  )
}

function BotaoDesativar({ linha, aoDesativar }: { linha: LinhaDeUsuario; aoDesativar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)
  const nome = linha.nome ?? linha.email
  return (
    <>
      <button type="button" className="botao botao-secundario" aria-label={`Desativar ${linha.email}`}
        onClick={() => setConfirmando(true)}>
        Desativar
      </button>
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Desativar ${nome}?`}
        texto={`${nome} perde o acesso à plataforma. O nome e o histórico continuam registrados, e você pode reativar depois.`}
        rotuloDaAcao="Desativar" aoConfirmar={aoDesativar} aoFechar={() => setConfirmando(false)} />
    </>
  )
}
