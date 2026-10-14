import { useCallback } from 'react'
import type { AreaComTela } from '../components/moldura/areas'
import { lerEnderecoDosProcessos } from '../processos/enderecoDosProcessos'
import { useEndereco } from './useEndereco'

// A área é o primeiro trecho do endereço (#/setores/macroprocessos → setores); Quadro e Lista moram em #/processos.
function areaDoEndereco(endereco: string): AreaComTela {
  const area = endereco.split('/')[1]
  if (area === 'administracao' || area === 'setores') return area
  return lerEnderecoDosProcessos(endereco).visao
}

const ENDERECO_DA_AREA: Record<AreaComTela, string> = {
  quadro: '#/processos', lista: '#/processos/lista', setores: '#/setores', administracao: '#/administracao',
}

export function useAreaAtual(): [AreaComTela, (area: AreaComTela) => void] {
  const [endereco, irParaEndereco] = useEndereco()
  const irPara = useCallback((nova: AreaComTela) => irParaEndereco(ENDERECO_DA_AREA[nova]), [irParaEndereco])
  return [areaDoEndereco(endereco), irPara]
}
