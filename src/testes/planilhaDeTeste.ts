// Uma aba PRODUTO 33 inventada (setores XYZ e ABC, "Exemplo Alfa"), no formato de .amostra/cabecalho.md: duas linhas de título,
// o cabeçalho e as linhas de dados. Compartilhada pelos testes da leitura e da tela de Importação.
export const CABECALHO_DA_PLANILHA = [
  'Área', 'Macros', 'Processos', '', 'I - Ident. Respons.', 'II - Reun. Sensib.', 'III - Ident. Macrop.',
  'Modelagem Piloto', 'Data da Modelagem Piloto', 'Modelagem Técnica', 'Revisão Interna', 'V - Relatório Piloto',
  'VI - Revisão e validação', 'VII - Publicação', 'Data da Publicação', 'VIII - Avaliação', 'IX - Remodelagem',
  'Observações', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8',
]

export type ParteDaLinha = {
  area?: string; macro?: string; nome?: string; mp?: string; dmp?: string; mt?: string; ri?: string; rp?: string
  vi?: string; vii?: string; dp?: string; obs?: string
}

const PADRAO: Required<ParteDaLinha> = {
  area: 'XYZ', macro: 'I - Gestão de exemplos', nome: 'Exemplo Alfa', mp: '', dmp: '', mt: '', ri: '', rp: '', vi: '', vii: '',
  dp: '', obs: '',
}

/** Uma linha de dados: cada campo é a coluna da planilha com o mesmo nome; as colunas não usadas ficam vazias. */
export function linhaDaPlanilha(parte: ParteDaLinha): string[] {
  const p = { ...PADRAO, ...parte }
  return [
    p.area, p.macro, p.nome, '', '', '', '', p.mp, p.dmp, p.mt, p.ri, p.rp, p.vi, p.vii, p.dp, '', '', p.obs,
    'x', '', '', '', '', '', '', '',
  ]
}

export function csvDaPlanilha(linhas: string[][], separador = ';', cabecalho = CABECALHO_DA_PLANILHA): string {
  const titulo = ['ETAPAS DO MAPEAMENTO', ...Array<string>(25).fill('')]
  const subtitulo = ['', '', '', '', '', '', '', 'IV - Modelagem', ...Array<string>(18).fill('')]
  return [titulo, subtitulo, cabecalho, ...linhas].map((l) => l.join(separador)).join('\r\n')
}
