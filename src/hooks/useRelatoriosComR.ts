import { useEffect, useState } from 'react'
import type { ModuloDeImportacao, RelatorioComV, RelatoriosComV } from '../importacao/tipos'

export type FaseDosRelatoriosComR =
  | { tipo: 'procurando' }
  | { tipo: 'erro' }
  | { tipo: 'pronto'; relatorios: RelatoriosComV }
  | { tipo: 'renomeando'; feitos: number; total: number }
  | { tipo: 'fim'; renomeados: number; falhas: number }

// Um relatório por vez (uma chamada da função do servidor por arquivo, por causa do tempo-limite dela); a falha de um não
// para os outros, e o que deu certo fica.
async function renomearUmPorUm(importacao: ModuloDeImportacao, lista: RelatorioComV[], aoAndar: (feitos: number) => void) {
  let renomeados = 0
  for (const [posicao, relatorio] of lista.entries()) {
    renomeados += await importacao.renomearRelatorio(relatorio).then(() => 1, () => 0)
    aoAndar(posicao + 1)
  }
  return { renomeados, falhas: lista.length - renomeados }
}

function faseDaLeitura(importacao: ModuloDeImportacao): Promise<FaseDosRelatoriosComR> {
  return importacao.listarRelatoriosComV().then((relatorios) => ({ tipo: 'pronto', relatorios }), () => ({ tipo: 'erro' }))
}

/**
 * A seção "3. Relatórios com R" (ADR 0047): lê ao abrir, renomeia os com V e, no fim com falhas, [Tentar de novo] lê de novo e
 * renomeia só os que faltam (os renomeados já não aparecem com V).
 */
export function useRelatoriosComR(importacao: ModuloDeImportacao) {
  const [fase, setFase] = useState<FaseDosRelatoriosComR>({ tipo: 'procurando' })

  useEffect(() => {
    let ativo = true
    void faseDaLeitura(importacao).then((lida) => { if (ativo) setFase(lida) })
    return () => { ativo = false }
  }, [importacao])

  async function ler(): Promise<FaseDosRelatoriosComR> {
    setFase({ tipo: 'procurando' })
    const lida = await faseDaLeitura(importacao)
    setFase(lida)
    return lida
  }

  async function renomear(lista: RelatorioComV[]) {
    setFase({ tipo: 'renomeando', feitos: 0, total: lista.length })
    const fim = await renomearUmPorUm(importacao, lista, (feitos) => setFase({ tipo: 'renomeando', feitos, total: lista.length }))
    setFase({ tipo: 'fim', ...fim })
  }

  async function continuar() {
    const lida = await ler()
    if (lida.tipo === 'pronto' && lida.relatorios.aRenomear.length > 0) await renomear(lida.relatorios.aRenomear)
  }

  return { fase, ler, renomear, continuar }
}
