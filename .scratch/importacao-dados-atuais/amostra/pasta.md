# Desenho da pasta DOCUMENTOS MAPEAMENTO

Levantado em 2026-11-06 pela leitura dos nomes da pasta real (`Área de Trabalho\Documentos Mapeamento`), com autorização do usuário dada no momento. Só os nomes foram lidos; o conteúdo dos arquivos não foi aberto. Aqui, siglas e nomes de processo são inventados, e as contagens são as reais.

## Estrutura

```
Documentos Mapeamento/
  log_renomeacao.csv          ← fora do padrão (registro de uma renomeação feita antes; colunas Situacao, Origem, Destino)
  Renomear-Padrao.ps1         ← fora do padrão (o script dessa renomeação)
  ABC/                        ← uma pasta por sigla do setor (18 siglas; algumas com hífen, como ABC-DEF)
    ABC_V1F_Processo Inventado.bpm
    ABC_V1F_Processo Inventado.png
    ABC_V2_Processo Inventado.bpm
    ABC_V2_Processo Inventado_Relatório.docx
    ABC_V2_Processo Inventado_Relatório.pdf
    ABC_V1P_Outro Processo_Relatório.docx
  XYZ/
    Grupo de Processos/       ← exceção: um nível a mais (1 caso, 9 arquivos); a sigla do nome é a da pasta de cima
      XYZ_V2_Processo Inventado.bpm
```

- 407 arquivos, 23 subpastas (22 de setor e 1 dentro de um setor).
- Extensões: `.bpm` 174, `.png` 114, `.docx` 93, `.pdf` 24. Não há `.bpmn`.
- 93 processos distintos (sigla + nome).

## Padrão do nome

`SIGLA_V<número><sufixo>_<Nome do processo>[_Relatório].<extensão>`

- **SIGLA:** a da pasta do setor (igual em todos os casos, contando a subpasta extra pela pasta de cima).
- **Número:** V1 a V8 (V1 181 arquivos, V2 133, V3 36, V4 39, V5 4, V6 3, V7 8, V8 1). Nenhum V9 ou maior.
- **Sufixo:** `F` (92 arquivos), `P` (7) ou nenhum (306).
- **Nome do processo:** texto livre, com acentos, vírgulas e hífens ("Processo - Parte A", "Processo, Análise e Envio").
- **`_Relatório`:** marca o relatório; aparece em todos os `.docx` e `.pdf` e em nenhum `.bpm` ou `.png`.
- Só os dois arquivos da raiz estão fora do padrão.

## O que a pasta tem e a spec não prevê (a decidir antes do ticket 02)

1. **Mesmo número com sufixos diferentes no mesmo processo (14 versões).** Exemplos: `ABC_V1F_X.bpm` e `ABC_V1_X.bpm` lado a lado; `ABC_V1F_X.bpm` com `ABC_V1_X_Relatório.docx`; `ABC_V1F_X.bpm` com `ABC_V1P_X_Relatório.docx`. Como o número é único por processo, só um rótulo pode valer. Caminho provável: o rótulo da coluna V1 a V8 da planilha decide, e o arquivo com outro sufixo é listado.
2. **Relatório em `.docx` e `.pdf` na mesma versão (23 versões).** A spec (história 48) só prevê `.pdf` antigo sem número, que não existe na pasta: todo `.pdf` tem número. Falta decidir se o `.pdf` é o .pdf da aprovação (`pdfs_da_aprovacao`), um segundo relatório ou fica de fora.
3. **Mais de um `.docx` de relatório na mesma versão (1 caso, um com sufixo e outro sem).**
4. **Versões sem `.bpm` (11; 7 delas só com relatório).** A história 45 já cobre: listadas e fora, com as outras versões do processo entrando.
5. **Buracos na numeração (7 processos, por exemplo V1 e V3 sem V2).** A spec não fala disso; a planilha deve dizer se é falta de arquivo ou se a versão nunca existiu.
6. **Mais de uma versão `F` no mesmo processo (12 processos).**
7. **Subpasta extra dentro do setor (1 caso).** A leitura precisa olhar um nível abaixo da pasta do setor.
8. **O nome do processo no arquivo tem que bater com o da planilha.** Não foi conferido (a planilha não foi lida nesta sessão); diferença de acento, vírgula ou hífen vira "processo inexistente" pela regra da história 47.
