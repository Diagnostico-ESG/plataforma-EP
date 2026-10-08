# Auditoria de dependências

Linha de base do projeto, sobrescrita a cada auditoria do `/ship` (passo 3).

- **Data:** 2026-10-08
- **Origem:** `/ship login-perfis`
- **Método:** `npm audit --json`, rodado direto. A skill `security-auditor` falhou no Windows ("O sistema não pode encontrar o caminho especificado"), o problema conhecido previsto no passo 3 do `/ship`.

## Resultado

| Severidade | Quantidade |
|---|---|
| Crítica | 0 |
| Alta | 0 |
| Moderada | 0 |
| Baixa | 0 |
| Informativa | 0 |
| **Total** | **0** |

Pacotes avaliados: 413 (13 de produção, 401 de desenvolvimento, 38 opcionais).

## CVEs, versões afetadas e corrigidas

Nenhum.

## Remediação

Nada a fazer.
