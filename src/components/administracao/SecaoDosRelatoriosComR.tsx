import { type FaseDosRelatoriosComR, useRelatoriosComR } from '../../hooks/useRelatoriosComR'
import {
  ERRO_NA_LEITURA_DOS_RELATORIOS, NADA_A_RENOMEAR, PROCURANDO_RELATORIOS, fraseDasFalhas, fraseDoAndamento, fraseDoFim,
  fraseDosForaDoPadrao, fraseDosRelatoriosComV,
} from '../../importacao/frasesDosRelatoriosComR'
import type { ModuloDeImportacao, RelatoriosComV } from '../../importacao/tipos'

type Passos = ReturnType<typeof useRelatoriosComR>

function TentarDeNovo({ aoTentar }: { aoTentar: () => void }) {
  return (
    <div className="importacao-acoes">
      <button type="button" className="botao botao-secundario" onClick={aoTentar}>Tentar de novo</button>
    </div>
  )
}

function Pronto({ relatorios, aoRenomear }: { relatorios: RelatoriosComV; aoRenomear: () => void }) {
  const foraDoPadrao = relatorios.foraDoPadrao > 0 && <p>{fraseDosForaDoPadrao(relatorios.foraDoPadrao)}</p>
  if (relatorios.aRenomear.length === 0) return <><p>{NADA_A_RENOMEAR}</p>{foraDoPadrao}</>
  return (
    <>
      <p>{fraseDosRelatoriosComV(relatorios.aRenomear.length)}</p>
      {foraDoPadrao}
      <div className="importacao-acoes">
        <button type="button" className="botao botao-principal" onClick={aoRenomear}>Renomear para R</button>
      </div>
    </>
  )
}

function Fim({ renomeados, falhas, aoContinuar }: { renomeados: number; falhas: number; aoContinuar: () => void }) {
  return (
    <div role="status">
      <p>{fraseDoFim(renomeados)}</p>
      {falhas > 0 && (
        <>
          <p className="administracao-falha" role="alert">{fraseDasFalhas(falhas)}</p>
          <TentarDeNovo aoTentar={aoContinuar} />
        </>
      )}
    </div>
  )
}

function CorpoDaSecao({ fase, passos }: { fase: FaseDosRelatoriosComR; passos: Passos }) {
  if (fase.tipo === 'procurando') return <p className="cadastros-vazio" role="status">{PROCURANDO_RELATORIOS}</p>
  if (fase.tipo === 'erro') {
    return <><p className="administracao-falha" role="alert">{ERRO_NA_LEITURA_DOS_RELATORIOS}</p><TentarDeNovo aoTentar={() => void passos.ler()} /></>
  }
  if (fase.tipo === 'renomeando') return <p className="cadastros-vazio" role="status">{fraseDoAndamento(fase.feitos, fase.total)}</p>
  if (fase.tipo === 'fim') return <Fim renomeados={fase.renomeados} falhas={fase.falhas} aoContinuar={() => void passos.continuar()} />
  return <Pronto relatorios={fase.relatorios} aoRenomear={() => void passos.renomear(fase.relatorios.aRenomear)} />
}

/** "3. Relatórios com R" (ADR 0047): os relatórios numerados antigos ganham o R no Drive e na plataforma. Só o Administrador. */
export function SecaoDosRelatoriosComR({ importacao }: { importacao: ModuloDeImportacao }) {
  const passos = useRelatoriosComR(importacao)
  return <CorpoDaSecao fase={passos.fase} passos={passos} />
}
