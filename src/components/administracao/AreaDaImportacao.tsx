import { type ChangeEvent, useId } from 'react'
import { type FaseDaImportacao, useImportacaoDaPlanilha } from '../../hooks/useImportacaoDaPlanilha'
import { contar } from '../../importacao/frasesDaImportacao'
import type { ModuloDeImportacao } from '../../importacao/tipos'
import { PreviaDaImportacao } from './PreviaDaImportacao'
import { ResumoDaImportacao } from './ResumoDaImportacao'
import { SecaoDosArquivos } from './SecaoDosArquivos'

type AreaDaImportacaoProps = { importacao: ModuloDeImportacao }

function EscolherPlanilha({ recusa, aoEscolher }: { recusa: string | null; aoEscolher: (arquivo: File) => void }) {
  const idDoCampo = useId()
  function aoMudar(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (arquivo) aoEscolher(arquivo)
    evento.target.value = ''
  }
  return (
    <>
      <p>Escolha a aba PRODUTO 33 da planilha, salva como .csv. Nada é gravado antes de você confirmar.</p>
      <label htmlFor={idDoCampo}>Planilha (.csv)</label>{' '}
      <input id={idDoCampo} type="file" accept=".csv,text/csv" onChange={aoMudar} />
      {recusa && <p className="administracao-falha" role="alert">{recusa}</p>}
    </>
  )
}

function CorpoDaPrimeiraEtapa({ fase, passos }: { fase: FaseDaImportacao; passos: ReturnType<typeof useImportacaoDaPlanilha> }) {
  if (fase.tipo === 'escolher') return <EscolherPlanilha recusa={fase.recusa} aoEscolher={(a) => void passos.escolher(a)} />
  if (fase.tipo === 'lendo') return <p className="cadastros-vazio" role="status">Lendo a planilha…</p>
  if (fase.tipo === 'gravando') {
    return <p className="cadastros-vazio" role="status">Gravando… {fase.feitos} de {contar(fase.total, 'processo', 'processos')}.</p>
  }
  if (fase.tipo === 'resumo') return <ResumoDaImportacao resumo={fase.resumo} aoImportarOutro={passos.recomecar} />
  return <PreviaDaImportacao previa={fase.previa} aoConfirmar={() => void passos.confirmar()} aoEscolherOutro={passos.recomecar} />
}

/** Aba "Importação". Quem protege os dados é o banco (só o Administrador ativo grava); a aba só aparece a ele. */
export function AreaDaImportacao({ importacao }: AreaDaImportacaoProps) {
  const passos = useImportacaoDaPlanilha(importacao)
  return (
    <section className="administracao" aria-labelledby="titulo-importacao">
      <h2 id="titulo-importacao" className="administracao-titulo">Importação</h2>
      <p>Traz para a plataforma os dados atuais em duas etapas, nesta ordem: a planilha, depois os arquivos das versões.</p>
      <section aria-labelledby="titulo-cadastros-e-etapas" className="importacao-etapa">
        <h3 id="titulo-cadastros-e-etapas" className="importacao-subtitulo">1. Cadastros e etapas</h3>
        <CorpoDaPrimeiraEtapa fase={passos.fase} passos={passos} />
      </section>
      <section aria-labelledby="titulo-arquivos-das-versoes" className="importacao-etapa">
        <h3 id="titulo-arquivos-das-versoes" className="importacao-subtitulo">2. Arquivos das versões</h3>
        {/* Monta de novo ao fim da planilha: a seção, que só abre depois de uma importação, lê de novo se já houve uma. */}
        <SecaoDosArquivos key={passos.fase.tipo === 'resumo' ? 'depois-da-planilha' : 'antes-da-planilha'} importacao={importacao} />
      </section>
    </section>
  )
}
