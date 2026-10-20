import { type ReactNode, useCallback, useId, useState } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { assinaturaDasEtapas } from '../../processos/caminhoDeEtapas'
import { useConferenciaNoDrive } from '../../hooks/useConferenciaNoDrive'
import type { ProcessoLido } from '../../processos/tipos'
import type { ModoDoFormulario } from '../../versoes/formularioDeVersao'
import { haVersaoNova, ordenarVersoes, proximoNumero, versoesComRelatorioPendente } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { type ItemDoMenu, MenuDeAcoes } from '../MenuDeAcoes'
import '../processos/Painel.css'
import { FormularioDeRelatorio } from './FormularioDeRelatorio'
import { FormularioDeVersao } from './FormularioDeVersao'
import { ListaDeVersoes } from './ListaDeVersoes'
import { VersaoEmDestaque } from './VersaoEmDestaque'
import './Versoes.css'

type SecaoDeVersoesProps = { versoes: ModuloDeVersoes; processo: ProcessoLido; podeAlterar: boolean }

/**
 * Seção "Arquivos" do verso (as versões do processo e do subprocesso): a mais recente em destaque e as anteriores
 * recolhidas. Enviar, registrar histórica e acrescentar relatório só para Administrador e Integrante com o processo em
 * andamento; esconder o botão é conveniência, quem recusa é a função do servidor e o banco.
 */
export function SecaoDeVersoes({ versoes, processo, podeAlterar }: SecaoDeVersoesProps) {
  // Lê de novo quando as etapas mudam: concluir a Aprovação põe o selo "Aprovada" na versão e a volta o tira.
  const assinatura = assinaturaDasEtapas(processo.etapasDoProcesso)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a assinatura não é usada dentro: só faz a leitura se refazer quando as etapas mudam
  const ler = useCallback(() => versoes.listarVersoes(processo.id), [versoes, processo.id, assinatura])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const idDoTitulo = useId()
  const podeEnviar = podeAlterar && processo.situacao === 'em_andamento'
  return (
    <section className="painel-estrutura secao-de-versoes" aria-labelledby={idDoTitulo}>
      {estado.tipo === 'pronto'
        ? <VersoesProntas versoes={versoes} processo={processo} lidas={estado.valor} podeEnviar={podeEnviar} aoAlterada={recarregar}
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

/** O formulário que está aberto na seção: o de enviar ou registrar a histórica, ou o do relatório depois. */
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
      <TituloDosArquivos id={idDoTitulo}>{podeEnviar && !aberto && <AcoesDaSecao lidas={lidas} aoAbrir={setAberto} />}</TituloDosArquivos>
      {aberto && (
        <FormularioAberto aberto={aberto} versoes={versoes} processo={processo} lidas={lidas} aoEnviada={aposEnviar}
          aoCancelar={() => setAberto(null)} />
      )}
      {conferencia.tipo === 'falhou' && <p className="secao-de-versoes-aviso" role="status">Não foi possível conferir os arquivos no Drive.</p>}
      {!maisRecente && <p className="cadastros-vazio">Nenhuma versão enviada.</p>}
      {maisRecente && (
        <VersaoEmDestaque {...comum} versao={maisRecente} versoes={lidas} aoAcrescentarRelatorio={() => setAberto({ tipo: 'relatorio' })} />
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
    return (
      <FormularioDeRelatorio modulo={versoes} processo={processo} pendentes={versoesComRelatorioPendente(lidas)} aoEnviada={aoEnviada}
        aoCancelar={aoCancelar} />
    )
  }
  return <FormularioDeVersao modulo={versoes} processo={processo} modo={aberto} aoEnviada={aoEnviada} aoCancelar={aoCancelar} />
}

/**
 * As ações raras do "⋯" da seção: a versão histórica (só sem versão nova) e o relatório de uma versão anterior, quando
 * só ela está sem relatório (o da mais recente se acrescenta no espaço tracejado, no lugar dele).
 */
function itensRaros(lidas: Versao[], aoAbrir: (aberto: Aberto) => void): ItemDoMenu[] {
  const itens: ItemDoMenu[] = []
  if (!haVersaoNova(lidas)) itens.push({ rotulo: 'Registrar versão histórica', aoEscolher: () => aoAbrir({ tipo: 'historica' }) })
  const pendentes = versoesComRelatorioPendente(lidas)
  if (pendentes.length > 0 && pendentes[0].id !== ordenarVersoes(lidas)[0].id) {
    itens.push({ rotulo: 'Acrescentar relatório', aoEscolher: () => aoAbrir({ tipo: 'relatorio' }) })
  }
  return itens
}

function AcoesDaSecao({ lidas, aoAbrir }: { lidas: Versao[]; aoAbrir: (aberto: Aberto) => void }) {
  const raros = itensRaros(lidas, aoAbrir)
  return (
    <div className="secao-de-versoes-acoes">
      <button type="button" className="botao botao-secundario" onClick={() => aoAbrir({ tipo: 'nova', numero: proximoNumero(lidas) })}>
        Enviar versão
      </button>
      {raros.length > 0 && <MenuDeAcoes rotulo="Mais ações dos arquivos" grupos={[raros]} />}
    </div>
  )
}
