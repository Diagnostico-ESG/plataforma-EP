import { type ReactNode, useCallback, useId, useState } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useConferenciaNoDrive } from '../../hooks/useConferenciaNoDrive'
import type { ProcessoLido } from '../../processos/tipos'
import { type ModoDoFormulario, modoParaEnviar } from '../../versoes/formularioDeVersao'
import { type EnvioDaEtapa, envioDaEtapa, ordenarVersoes, podeEnviarRelatorioNaEtapa } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../processos/Painel.css'
import { FormularioDeRelatorio } from './FormularioDeRelatorio'
import { FormularioDeVersao } from './FormularioDeVersao'
import { ListaDeVersoes } from './ListaDeVersoes'
import { VersaoEmDestaque } from './VersaoEmDestaque'
import './Versoes.css'

type SecaoDeVersoesProps = {
  versoes: ModuloDeVersoes
  processo: ProcessoLido
  podeAlterar: boolean
  /** Avisa o verso quando as versões mudam (envio, relatório, substituição): o processo é lido de novo, para a última versão e a da passagem. */
  aoAlterarVersoes?: () => void
}

/**
 * Seção "Arquivos" do verso (as versões do processo e do subprocesso): a mais recente em destaque e as anteriores
 * recolhidas. O envio de versão que cabe na etapa atual (histórica, piloto ou em sequência), o relatório (sozinho, na técnica e
 * na Revisão interna) e acrescentar o .png ou o .bpmn só para Administrador e Integrante com o processo em andamento;
 * esconder o botão é conveniência, quem recusa é a função do servidor e o banco.
 */
export function SecaoDeVersoes({ versoes, processo, podeAlterar, aoAlterarVersoes }: SecaoDeVersoesProps) {
  // Lê de novo quando o processo muda de etapa: registrar a aprovação põe o selo "Aprovada" na versão.
  const etapaAtual = processo.etapaAtual?.id
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a etapa atual não é usada dentro: só faz a leitura se refazer quando ela muda
  const ler = useCallback(() => versoes.listarVersoes(processo.id), [versoes, processo.id, etapaAtual])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const idDoTitulo = useId()
  const podeEnviar = podeAlterar && processo.situacao === 'em_andamento'
  return (
    <section className="painel-estrutura secao-de-versoes" aria-labelledby={idDoTitulo}>
      {estado.tipo === 'pronto'
        ? <VersoesProntas versoes={versoes} processo={processo} lidas={estado.valor} podeEnviar={podeEnviar}
            aoAlterada={() => {
              recarregar()
              aoAlterarVersoes?.()
            }}
            idDoTitulo={idDoTitulo} />
        : <TituloDosArquivos id={idDoTitulo} />}
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="as versões" aoTentarDeNovo={tentarDeNovo} />}
    </section>
  )
}

function TituloDosArquivos({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <div className="secao-de-versoes-titulo">
      <h3 id={id} className="painel-subtitulo">Arquivos</h3>
      {children}
    </div>
  )
}

type VersoesProntasProps = {
  versoes: ModuloDeVersoes; processo: ProcessoLido; lidas: Versao[]; podeEnviar: boolean; aoAlterada: () => void; idDoTitulo: string
}

/** O formulário que está aberto na seção: o de enviar a versão da etapa (ou registrar a histórica), ou o do relatório. */
type Aberto = ModoDoFormulario | { tipo: 'relatorio' }

function VersoesProntas({ versoes, processo, lidas, podeEnviar, aoAlterada, idDoTitulo }: VersoesProntasProps) {
  const [aberto, setAberto] = useState<Aberto | null>(null)
  const conferencia = useConferenciaNoDrive(versoes, processo.id, lidas)
  const aposEnviar = () => {
    setAberto(null)
    aoAlterada()
  }
  const situacoes = conferencia.tipo === 'pronta' ? conferencia.situacoes : undefined
  const [maisRecente, ...anteriores] = ordenarVersoes(lidas)
  const comum = { modulo: versoes, processoId: processo.id, podeAlterar: podeEnviar, aoAlterada, situacoes }
  return (
    <>
      <TituloDosArquivos id={idDoTitulo}>
        {podeEnviar && (
          <AcoesDaSecao lidas={lidas} codigoDaEtapa={processo.etapaAtual?.codigo ?? ''} aberto={aberto} aoAbrir={setAberto} />
        )}
      </TituloDosArquivos>
      {aberto && (
        <FormularioAberto aberto={aberto} versoes={versoes} processo={processo} lidas={lidas} aoEnviada={aposEnviar}
          aoCancelar={() => setAberto(null)} />
      )}
      {conferencia.tipo === 'falhou' && <p className="secao-de-versoes-aviso" role="status">Não foi possível conferir os arquivos no Drive.</p>}
      {!maisRecente && <p className="cadastros-vazio">Nenhuma versão enviada.</p>}
      {maisRecente && (
        <VersaoEmDestaque {...comum} versao={maisRecente} versoes={lidas} />
      )}
      {anteriores.length > 0 && (
        <details className="versoes-anteriores">
          <summary>{`Versões anteriores (${anteriores.length})`}</summary>
          <ListaDeVersoes {...comum} versoes={anteriores} todas={lidas} />
        </details>
      )}
    </>
  )
}

type FormularioAbertoProps = {
  aberto: Aberto; versoes: ModuloDeVersoes; processo: ProcessoLido; lidas: Versao[]; aoEnviada: () => void; aoCancelar: () => void
}

function FormularioAberto({ aberto, versoes, processo, lidas, aoEnviada, aoCancelar }: FormularioAbertoProps) {
  if (aberto.tipo === 'relatorio') {
    return <FormularioDeRelatorio modulo={versoes} processo={processo} versoes={lidas} aoEnviada={aoEnviada} aoCancelar={aoCancelar} />
  }
  return <FormularioDeVersao modulo={versoes} processo={processo} modo={aberto} aoEnviada={aoEnviada} aoCancelar={aoCancelar} />
}

const ROTULO_DO_ENVIO: Record<EnvioDaEtapa, string> = {
  historica: 'Registrar versão histórica', piloto: 'Enviar versão piloto', sequencia: 'Enviar versão',
}

function modoDoEnvio(envio: EnvioDaEtapa, lidas: Versao[]): ModoDoFormulario {
  return envio === 'historica' ? { tipo: 'historica' } : modoParaEnviar(envio, lidas)
}

type AcoesDaSecaoProps = {
  lidas: Versao[]; codigoDaEtapa: string; aberto: Aberto | null; aoAbrir: (aberto: Aberto | null) => void
}

/** Os botões do envio da etapa atual (o mesmo botão abre e fecha o formulário); nada se a etapa não tem envio. */
function AcoesDaSecao({ lidas, codigoDaEtapa, aberto, aoAbrir }: AcoesDaSecaoProps) {
  const envio = envioDaEtapa(codigoDaEtapa, lidas)
  const relatorio = podeEnviarRelatorioNaEtapa(codigoDaEtapa, lidas)
  if (!envio && !relatorio) return null
  return (
    <div className="secao-de-versoes-acoes">
      {envio && (
        <button type="button" className="botao botao-secundario" aria-expanded={aberto?.tipo === envio}
          onClick={() => aoAbrir(aberto?.tipo === envio ? null : modoDoEnvio(envio, lidas))}>
          {ROTULO_DO_ENVIO[envio]}
        </button>
      )}
      {relatorio && (
        <button type="button" className="botao botao-secundario" aria-expanded={aberto?.tipo === 'relatorio'}
          onClick={() => aoAbrir(aberto?.tipo === 'relatorio' ? null : { tipo: 'relatorio' })}>
          Enviar relatório
        </button>
      )}
    </div>
  )
}
