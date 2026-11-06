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

- 401 arquivos (releitura de 2026-11-06, depois de ajustes do usuário na pasta), 23 subpastas (22 de setor e 1 dentro de um setor).
- Extensões: `.bpm` 171, `.png` 112, `.docx` 92, `.pdf` 24. Não há `.bpmn`.
- 93 processos distintos (sigla + nome).

## Padrão do nome

`SIGLA_V<número><sufixo>_<Nome do processo>[_Relatório].<extensão>`

- **SIGLA:** a da pasta do setor (igual em todos os casos, contando a subpasta extra pela pasta de cima).
- **Número:** V1 a V8 (V1 173 arquivos, V2 131, V3 40, V4 39, V5 4, V6 3, V7 8, V8 1). Nenhum V9 ou maior.
- **Sufixo:** `F` (95 arquivos), `P` (11) ou nenhum (293).
- **Nome do processo:** texto livre, com acentos, vírgulas e hífens ("Processo - Parte A", "Processo, Análise e Envio").
- **`_Relatório`:** marca o relatório; aparece em todos os `.docx` e `.pdf` e em nenhum `.bpm` ou `.png`.
- Só os dois arquivos da raiz estão fora do padrão.

## O que a pasta tem e a spec não prevê (a decidir antes do ticket 02)

1. **Mesmo número com sufixos diferentes no mesmo processo (5 versões, eram 14 antes dos ajustes do usuário).** Em todas, só um lado tem o `.bpm`; nenhuma tem dois `.bpm`. Exemplos: `ABC_V1F_X.png` com `ABC_V1_X_Relatório.docx`; `ABC_V1F_X.bpm` com `ABC_V1_X_Relatório.docx`; `ABC_V1F_X.bpm` com `ABC_V1P_X_Relatório.docx`. Como o número é único por processo, só um rótulo pode valer. Caminho provável: o rótulo da coluna V1 a V8 da planilha decide, e o arquivo com outro sufixo é listado.
2. **Relatório em `.docx` e `.pdf` na mesma versão (23 versões).** A spec (história 48) só prevê `.pdf` antigo sem número, que não existe na pasta: todo `.pdf` tem número. Falta decidir se o `.pdf` é o .pdf da aprovação (`pdfs_da_aprovacao`), um segundo relatório ou fica de fora.
3. **Mais de um `.docx` de relatório na mesma versão (1 caso, um com sufixo e outro sem).**
4. **Versões sem `.bpm` (11; 7 delas só com relatório).** A história 45 já cobre: listadas e fora, com as outras versões do processo entrando.
5. **Buracos na numeração (5 processos, por exemplo V1 e V3 sem V2).** A spec não fala disso; a planilha deve dizer se é falta de arquivo ou se a versão nunca existiu.
6. **Mais de uma versão `F` no mesmo processo (12 processos).**
7. **Subpasta extra dentro do setor (1 caso).** A leitura precisa olhar um nível abaixo da pasta do setor.
8. **O nome do processo no arquivo tem que bater com o da planilha.** Não foi conferido (a planilha não foi lida nesta sessão); diferença de acento, vírgula ou hífen vira "processo inexistente" pela regra da história 47.

## Decisões do usuário (2026-11-06)

Respostas dadas na conversa, a levar à spec e ao ticket 02 pelo `/planejar`. A numeração segue a da lista acima.

- **Fonte das versões:** a pasta manda, não as colunas V1 a V8 da planilha. Entra o que está na pasta. A diferença entre a pasta e a planilha (arquivo sem a versão na planilha, ou versão da planilha sem arquivo) só vai para o relatório final.
- **1. Sufixos:** o número é único por processo e sequencial, qualquer que seja a letra (corrigido pelo usuário na mesma conversa: `V1F` e `V1` não convivem). A letra `F` marca a versão histórica, que entra em Versões históricas; a `P` é a piloto; sem letra, a versão em sequência. Nas versões que repetem o número com letras diferentes (5 depois dos ajustes da pasta, todas com um só `.bpm`), o relatório e o `.png` entram na versão do `.bpm`, com a letra dela; a letra diferente é tratada como erro de digitação e vira aviso no relatório final.
- **2. `.docx` e `.pdf` na mesma versão:** o `.docx` entra como o relatório da versão; o `.pdf` entra nos outros anexos.
- **3. Dois `.docx` de relatório na mesma versão:** fica de fora; o usuário vê depois. Listar no relatório final.
- **4. Buracos na numeração:** fica como está; carrega só o que tem na pasta. Listar as lacunas no relatório final.
- **5. Mais de uma versão `F`:** é assim mesmo. Todas as `F` entram como versões históricas (Versões históricas, na plataforma).
- **6. Subpasta dentro do setor:** os arquivos entram no setor (pela sigla), com uma observação nas Anotações do processo dizendo o nome da subpasta.
- **7. Nome que não bate com a planilha:** o risco foi aceito; o arquivo sem processo correspondente não entra e é listado no relatório final.
- **8. Versões sem `.bpm`:** ficam de fora e são listadas no relatório final.
