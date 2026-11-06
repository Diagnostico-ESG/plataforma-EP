import type { Previa } from '../../importacao/executarImportacao'
import { contar } from '../../importacao/frasesDaImportacao'
import { chaveDoProcesso } from '../../importacao/chaves'
import { AvisosDaImportacao } from './AvisosDaImportacao'

type PreviaDaImportacaoProps = { previa: Previa; aoConfirmar: () => void; aoEscolherOutro: () => void }

function ResumoDaPrevia({ previa }: { previa: Previa }) {
  return (
    <p className="importacao-contagens">
      Vão entrar {contar(previa.novos.length, 'processo', 'processos')}, {contar(previa.setoresNovos, 'setor novo', 'setores novos')} e{' '}
      {contar(previa.macroprocessosNovos, 'macroprocesso novo', 'macroprocessos novos')}.
      {previa.jaExistem.length > 0 && ` ${contar(previa.jaExistem.length, 'processo já existe e será pulado', 'processos já existem e serão pulados')}.`}
    </p>
  )
}

function TabelaDaPrevia({ previa }: { previa: Previa }) {
  const jaExistem = new Set(previa.jaExistem.map((p) => chaveDoProcesso(p.setor, p.nome)))
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Setor</th><th scope="col">Macroprocesso</th><th scope="col">Processo</th>
          <th scope="col">Etapa</th><th scope="col">Situação</th>
        </tr>
      </thead>
      <tbody>
        {previa.lida.processos.map((p) => (
          <tr key={p.linha}>
            <td>{p.setor}</td><td>{p.macroprocesso}</td><td>{p.nome}</td><td>{p.etapaNome}</td>
            <td>{jaExistem.has(chaveDoProcesso(p.setor, p.nome)) ? 'Já existia' : 'Novo'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function PreviaDaImportacao({ previa, aoConfirmar, aoEscolherOutro }: PreviaDaImportacaoProps) {
  const semNovos = previa.novos.length === 0
  return (
    <>
      <ResumoDaPrevia previa={previa} />
      <AvisosDaImportacao lida={previa.lida} />
      <TabelaDaPrevia previa={previa} />
      {semNovos && <p className="cadastros-vazio">Nada a gravar: todos os processos da planilha já existem.</p>}
      <div className="importacao-acoes">
        <button type="button" className="botao botao-principal" disabled={semNovos} onClick={aoConfirmar}>Confirmar importação</button>
        <button type="button" className="botao" onClick={aoEscolherOutro}>Escolher outro arquivo</button>
      </div>
    </>
  )
}
