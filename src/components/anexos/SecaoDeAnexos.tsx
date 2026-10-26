import { type ReactNode, useCallback, useId, useState } from 'react'
import { ordenarAnexos } from '../../anexos/regrasDoAnexo'
import type { Anexo } from '../../anexos/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useConferenciaNoDrive } from '../../hooks/useConferenciaNoDrive'
import { useRetiradaDeAnexo } from '../../hooks/useRetiradaDeAnexo'
import type { ProcessoLido } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../processos/Painel.css'
import '../versoes/Versoes.css'
import { FormularioDeAnexo } from './FormularioDeAnexo'
import { ListaDeAnexos } from './ListaDeAnexos'
import { RetiradaDeAnexo } from './RetiradaDeAnexo'
import './Anexos.css'

type SecaoDeAnexosProps = {
  versoes: ModuloDeVersoes
  processo: ProcessoLido
  /** Administrador ou Integrante (e processo não arquivado); quem recusa é a função do servidor e o banco. */
  podeAlterar: boolean
}

/**
 * Seção "Outros anexos" do verso, abaixo dos arquivos das versões, em todas as etapas e para todo perfil: os arquivos avulsos
 * do processo, do mais recente ao mais antigo. [Enviar anexo] só para quem altera, com o processo em andamento (suspenso,
 * cancelado, concluído e arquivado só leem e baixam), e [Retirar] em cada linha para os mesmos. Esconder os botões é conveniência.
 */
export function SecaoDeAnexos({ versoes, processo, podeAlterar }: SecaoDeAnexosProps) {
  const modulo = versoes.anexos
  const ler = useCallback(() => modulo.listarAnexos(processo.id), [modulo, processo.id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const idDoTitulo = useId()
  const podeEnviar = podeAlterar && processo.situacao === 'em_andamento'
  return (
    <section className="painel-estrutura secao-de-versoes secao-de-anexos" aria-labelledby={idDoTitulo}>
      {estado.tipo === 'pronto'
        ? <AnexosProntos versoes={versoes} processoId={processo.id} lidos={estado.valor} podeEnviar={podeEnviar} aoMudar={recarregar} idDoTitulo={idDoTitulo} />
        : <TituloDosAnexos id={idDoTitulo} />}
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="os anexos" aoTentarDeNovo={tentarDeNovo} />}
    </section>
  )
}

function TituloDosAnexos({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <div className="secao-de-versoes-titulo">
      <h3 id={id} tabIndex={-1} className="painel-subtitulo">Outros anexos</h3>
      {children}
    </div>
  )
}

type AnexosProntosProps = {
  versoes: ModuloDeVersoes; processoId: string; lidos: Anexo[]; podeEnviar: boolean; aoMudar: () => void; idDoTitulo: string
}

// Quem pode enviar também pode retirar (mesmo perfil, mesmo processo em andamento); a lista é lida de novo a cada mudança.
function AnexosProntos({ versoes, processoId, lidos, podeEnviar, aoMudar, idDoTitulo }: AnexosProntosProps) {
  const [aberto, setAberto] = useState(false)
  // A linha retirada leva o foco com ela (o <dialog> o devolveria a um botão que já não existe): ele vai para o título da seção.
  const retirada = useRetiradaDeAnexo(versoes.anexos, (retirou) => {
    aoMudar()
    if (retirou) document.getElementById(idDoTitulo)?.focus()
  })
  // A conferência com o Drive devolve o mapa de todos os arquivos do processo (versões, .pdfs e anexos), pelo id.
  // ponytail: segunda chamada de conferir por verso (a das versões já faz uma); subir a conferência para o verso se o custo pesar.
  const conferencia = useConferenciaNoDrive(versoes, processoId, lidos)
  const situacoes = conferencia.tipo === 'pronta' ? conferencia.situacoes : undefined
  return (
    <>
      <TituloDosAnexos id={idDoTitulo}>
        {podeEnviar && (
          <button type="button" className="botao botao-secundario" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
            Enviar anexo
          </button>
        )}
      </TituloDosAnexos>
      {aberto && (
        <FormularioDeAnexo modulo={versoes.anexos} processoId={processoId} aoCancelar={() => setAberto(false)}
          aoEnviado={() => {
            setAberto(false)
            aoMudar()
          }} />
      )}
      <RetiradaDeAnexo anexo={retirada.aConfirmar} falha={retirada.falha} aoConfirmar={retirada.confirmar} aoFechar={retirada.cancelar} />
      {conferencia.tipo === 'falhou' && <p className="secao-de-versoes-aviso" role="status">Não foi possível conferir os anexos no Drive.</p>}
      {lidos.length === 0
        ? <p className="cadastros-vazio">Nenhum anexo.</p>
        : <ListaDeAnexos versoes={versoes} anexos={ordenarAnexos(lidos)} situacoes={situacoes} podeRetirar={podeEnviar}
            aoPedirRetirada={retirada.pedir} />}
    </>
  )
}
