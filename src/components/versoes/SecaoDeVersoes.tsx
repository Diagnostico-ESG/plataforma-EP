import { useCallback, useState } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ProcessoLido } from '../../processos/tipos'
import type { ModoDoFormulario } from '../../versoes/formularioDeVersao'
import { haVersaoNova, proximoNumero } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../processos/Painel.css'
import { FormularioDeVersao } from './FormularioDeVersao'
import { ListaDeVersoes } from './ListaDeVersoes'
import './Versoes.css'

type SecaoDeVersoesProps = { versoes: ModuloDeVersoes; processo: ProcessoLido; podeAlterar: boolean }

/**
 * Seção "Versões" do painel do processo (e do subprocesso). Enviar e registrar histórica só para Administrador e
 * Integrante com o processo em andamento; esconder o botão é conveniência, quem recusa é a função do servidor e o banco.
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
        <VersoesProntas versoes={versoes} processo={processo} lidas={estado.valor} podeEnviar={podeEnviar} aoEnviada={recarregar} />
      )}
    </section>
  )
}

type VersoesProntasProps = {
  versoes: ModuloDeVersoes; processo: ProcessoLido; lidas: Versao[]; podeEnviar: boolean; aoEnviada: () => void
}

function VersoesProntas({ versoes, processo, lidas, podeEnviar, aoEnviada }: VersoesProntasProps) {
  const [aberto, setAberto] = useState<ModoDoFormulario | null>(null)
  const aposEnviar = () => {
    setAberto(null)
    aoEnviada()
  }
  return (
    <>
      {aberto && (
        <FormularioDeVersao modulo={versoes} processo={processo} modo={aberto} aoEnviada={aposEnviar} aoCancelar={() => setAberto(null)} />
      )}
      <ListaDeVersoes modulo={versoes} versoes={lidas} />
      {podeEnviar && !aberto && (
        <div className="secao-de-versoes-acoes">
          <button type="button" className="botao botao-secundario" onClick={() => setAberto({ tipo: 'nova', numero: proximoNumero(lidas) })}>
            Enviar versão
          </button>
          {!haVersaoNova(lidas) && (
            <button type="button" className="botao botao-secundario" onClick={() => setAberto({ tipo: 'historica' })}>
              Registrar versão histórica
            </button>
          )}
        </div>
      )}
    </>
  )
}
