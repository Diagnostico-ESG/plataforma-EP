import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'
import { CODIGO_CONCLUIDOS } from '../../processos/codigosDasEtapas'
import { pessoaDaOpcao } from '../../processos/pessoaDaOpcao'
import { situacaoDoResponsavelInicial } from '../../processos/responsavelInicial'
import type { EtapaNoCatalogo, ResponsavelInicialDaEtapa, UsuarioResponsavel } from '../../processos/tipos'

type CampoDoResponsavelInicialProps = {
  etapa: EtapaNoCatalogo
  /** Quem pode ser escolhido agora (ativos, Administrador ou Integrante), em ordem de nome. */
  usuarios: UsuarioResponsavel[]
  aoEscolher: (etapa: EtapaNoCatalogo, usuarioId: string | null) => void
}

const MARCA: Record<'inativo' | 'sem_permissao', string> = { inativo: '(inativo)', sem_permissao: '(sem permissão)' }
const AVISO: Record<'inativo' | 'sem_permissao', string> = {
  inativo: 'Responsável inicial inativo: escolha outro ou Ninguém.',
  sem_permissao: 'Responsável inicial sem permissão: escolha outro ou Ninguém.',
}

// O valor vem sempre da etapa lida: a gravação que falha deixa a caixa como estava. O nome inválido continua visível,
// marcado e desabilitado, e não aparece entre as opções novas.
export function CampoDoResponsavelInicial({ etapa, usuarios, aoEscolher }: CampoDoResponsavelInicialProps) {
  if (etapa.codigo === CODIGO_CONCLUIDOS) return <>—</>
  const atual = etapa.responsavelInicial ?? null
  const situacao = atual ? situacaoDoResponsavelInicial(atual) : 'valido'
  return (
    <>
      <select className="seletor-perfil" aria-label={`Responsável inicial de ${etapa.nome}`} value={atual?.id ?? ''}
        onChange={(mudanca) => aoEscolher(etapa, mudanca.target.value === '' ? null : mudanca.target.value)}>
        <BotaoDaCaixa />
        <OpcaoDaCaixa valor="" rotulo="Ninguém" />
        {atual && !usuarios.some((usuario) => usuario.id === atual.id) && <OpcaoDoAtual atual={atual} situacao={situacao} />}
        {usuarios.map((usuario) => <OpcaoDaCaixa key={usuario.id} valor={usuario.id} rotulo={usuario.nome} pessoa={pessoaDaOpcao(usuario)} />)}
      </select>
      {situacao !== 'valido' && <p className="administracao-aviso">{AVISO[situacao]}</p>}
    </>
  )
}

function OpcaoDoAtual({ atual, situacao }: { atual: ResponsavelInicialDaEtapa; situacao: ReturnType<typeof situacaoDoResponsavelInicial> }) {
  const marcado = situacao !== 'valido'
  return <OpcaoDaCaixa valor={atual.id} rotulo={marcado ? `${atual.nome} ${MARCA[situacao]}` : atual.nome} pessoa={pessoaDaOpcao(atual)} desabilitada={marcado} />
}
