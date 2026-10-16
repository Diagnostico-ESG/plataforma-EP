import { useCallback, useState } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ProcessoLido } from '../../processos/tipos'
import type { ModoDoFormulario } from '../../versoes/formularioDeVersao'
import { haVersaoNova, proximoNumero, versoesComRelatorioPendente } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../processos/Painel.css'
import { FormularioDeRelatorio } from './FormularioDeRelatorio'
import { FormularioDeVersao } from './FormularioDeVersao'
import { ListaDeVersoes } from './ListaDeVersoes'
import './Versoes.css'

type SecaoDeVersoesProps = { versoes: ModuloDeVersoes; processo: ProcessoLido; podeAlterar: boolean }

/**
 * Seção "Versões" do painel do processo (e do subprocesso). Enviar, registrar histórica e acrescentar relatório só para
 * Administrador e Integrante com o processo em andamento; esconder o botão é conveniência, quem recusa é a função do
 * servidor e o banco.
 */
export function SecaoDeVersoes({ versoes, processo, podeAlterar }: SecaoDeVersoesProps) {
  const ler = useCallback(() => versoes.listarVersoes(processo.id), [versoes, processo.id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const podeEnviar = podeAlterar && processo.situacao === 'em_andamento'
  return (
    <section className="painel-estrutura secao-de-versoes" aria-label="Versões do processo">
      <h3 className="painel-subtitulo">Versões</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="as versões" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && (
        <VersoesProntas versoes={versoes} processo={processo} lidas={estado.valor} podeEnviar={podeEnviar} aoAlterada={recarregar} />
      )}
    </section>
  )
}

type VersoesProntasProps = {
  versoes: ModuloDeVersoes; processo: ProcessoLido; lidas: Versao[]; podeEnviar: boolean; aoAlterada: () => void
}

/** O formulário que está aberto na seção: o de enviar ou registrar a histórica, ou o do relatório depois. */
type Aberto = ModoDoFormulario | { tipo: 'relatorio' }

function VersoesProntas({ versoes, processo, lidas, podeEnviar, aoAlterada }: VersoesProntasProps) {
  const [aberto, setAberto] = useState<Aberto | null>(null)
  const aposEnviar = () => {
    setAberto(null)
    aoAlterada()
  }
  return (
    <>
      {aberto && (
        <FormularioAberto aberto={aberto} versoes={versoes} processo={processo} lidas={lidas} aoEnviada={aposEnviar}
          aoCancelar={() => setAberto(null)} />
      )}
      <ListaDeVersoes modulo={versoes} processoId={processo.id} versoes={lidas} podeAlterar={podeEnviar} aoAlterada={aoAlterada} />
      {podeEnviar && !aberto && <BotoesDaSecao lidas={lidas} aoAbrir={setAberto} />}
    </>
  )
}

type FormularioAbertoProps = {
  aberto: Aberto; versoes: ModuloDeVersoes; processo: ProcessoLido; lidas: Versao[]; aoEnviada: () => void; aoCancelar: () => void
}

function FormularioAberto({ aberto, versoes, processo, lidas, aoEnviada, aoCancelar }: FormularioAbertoProps) {
  if (aberto.tipo === 'relatorio') {
    return (
      <FormularioDeRelatorio modulo={versoes} processo={processo} pendentes={versoesComRelatorioPendente(lidas)} aoEnviada={aoEnviada}
        aoCancelar={aoCancelar} />
    )
  }
  return <FormularioDeVersao modulo={versoes} processo={processo} modo={aberto} aoEnviada={aoEnviada} aoCancelar={aoCancelar} />
}

function BotoesDaSecao({ lidas, aoAbrir }: { lidas: Versao[]; aoAbrir: (aberto: Aberto) => void }) {
  return (
    <div className="secao-de-versoes-acoes">
      <button type="button" className="botao botao-secundario" onClick={() => aoAbrir({ tipo: 'nova', numero: proximoNumero(lidas) })}>
        Enviar versão
      </button>
      {!haVersaoNova(lidas) && (
        <button type="button" className="botao botao-secundario" onClick={() => aoAbrir({ tipo: 'historica' })}>
          Registrar versão histórica
        </button>
      )}
      {versoesComRelatorioPendente(lidas).length > 0 && (
        <button type="button" className="botao botao-secundario" onClick={() => aoAbrir({ tipo: 'relatorio' })}>
          Acrescentar relatório
        </button>
      )}
    </div>
  )
}
