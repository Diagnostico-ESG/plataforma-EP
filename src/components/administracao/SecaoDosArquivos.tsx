import { type ChangeEvent, useId } from 'react'
import { type EscolhaDaPasta, type FaseDaPasta, arquivosDaPasta, useImportacaoDaPasta } from '../../hooks/useImportacaoDaPasta'
import { contar } from '../../importacao/frasesDaImportacao'
import type { ModuloDeImportacao } from '../../importacao/tipos'
import { PreviaDaPasta } from './PreviaDaPasta'
import { ResumoDaPasta } from './ResumoDaPasta'

type Passos = ReturnType<typeof useImportacaoDaPasta>

// O seletor nativo de pasta (sem dependência): o atributo não está nos tipos do React, por isso vai espalhado.
const SELETOR_DE_PASTA = { webkitdirectory: '' }

function arquivosDoCampo(evento: ChangeEvent<HTMLInputElement>): File[] {
  const arquivos = Array.from(evento.target.files ?? [])
  evento.target.value = ''
  return arquivos
}

function EscolherPasta({ recusa, escolha, aoEscolher }: { recusa: string | null; escolha: EscolhaDaPasta; aoEscolher: Passos['escolher'] }) {
  const idDaPasta = useId()
  const idDaPlanilha = useId()
  return (
    <>
      <p>Escolha a pasta DOCUMENTOS MAPEAMENTO e o mesmo .csv da planilha, que serve só para comparar as versões. Nada é enviado
        antes de você confirmar.</p>
      <div className="importacao-campos">
        <div className="campo-de-arquivo">
          <label htmlFor={idDaPasta}>Pasta DOCUMENTOS MAPEAMENTO</label>
          <input id={idDaPasta} type="file" multiple {...SELETOR_DE_PASTA}
            onChange={(evento) => void aoEscolher({ pasta: arquivosDaPasta(arquivosDoCampo(evento)) })} />
          {escolha.pasta && <p className="campo-de-arquivo-nome mono">{contar(escolha.pasta.length, 'arquivo', 'arquivos')}</p>}
        </div>
        <div className="campo-de-arquivo">
          <label htmlFor={idDaPlanilha}>Planilha (.csv) para comparar</label>
          <input id={idDaPlanilha} type="file" accept=".csv,text/csv"
            onChange={(evento) => void aoEscolher({ planilha: arquivosDoCampo(evento)[0] ?? null })} />
        </div>
      </div>
      {recusa && <p className="administracao-falha" role="alert">{recusa}</p>}
    </>
  )
}

function CorpoDaSegundaEtapa({ fase, passos }: { fase: FaseDaPasta; passos: Passos }) {
  if (fase.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando…</p>
  if (fase.tipo === 'fechada') return <p className="cadastros-vazio">Disponível depois da importação da planilha.</p>
  if (fase.tipo === 'escolher') return <EscolherPasta recusa={fase.recusa} escolha={passos.escolha} aoEscolher={passos.escolher} />
  if (fase.tipo === 'lendo') return <p className="cadastros-vazio" role="status">Lendo a pasta…</p>
  if (fase.tipo === 'enviando') {
    return <p className="cadastros-vazio" role="status">Enviando… {fase.feitos} de {contar(fase.total, 'arquivo', 'arquivos')}.</p>
  }
  if (fase.tipo === 'resumo') return <ResumoDaPasta resumo={fase.resumo} aoImportarDeNovo={passos.recomecar} />
  return <PreviaDaPasta previa={fase.previa} aoEnviar={() => void passos.enviar()} aoEscolherOutra={passos.recomecar} />
}

/** "2. Arquivos das versões": os arquivos vão do computador direto ao Drive, ligados às versões. Só o Administrador grava. */
export function SecaoDosArquivos({ importacao }: { importacao: ModuloDeImportacao }) {
  const passos = useImportacaoDaPasta(importacao)
  return <CorpoDaSegundaEtapa fase={passos.fase} passos={passos} />
}
