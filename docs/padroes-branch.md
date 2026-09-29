# Guia Completo de Padrões e Fluxo de Branches

Este documento detalha o fluxo de branches (baseado em Git Flow simplificado) e as convenções de nomenclatura obrigatórias para este repositório.

---

## 1. Estrutura e Papel das Branches Principais

| Branch | Finalidade | Regras de Merge e Acesso |
| :--- | :--- | :--- |
| `main` | **Ambiente de Produção** | Só recebe merges da branch `develop` (ao concluir uma release) ou de branches `hotfix/*`. **Proibido commitar diretamente.** |
| `develop` | **Ambiente de Integração** | Base de todas as branches de trabalho do dia a dia e destino padrão dos Pull Requests (PRs). **Proibido commitar diretamente.** |

---

## 2. Nomenclatura das Branches de Trabalho

Todas as branches de trabalho devem seguir rigorosamente o padrão:

```text
tipo/numero-da-issue-descricao-curta
```

### Componentes:
- **`tipo`**: Categoria da alteração (ver tabela abaixo).
- **`numero-da-issue`**: Número identificador da issue no GitHub (obrigatório sempre que houver issue associada).
- **`descricao-curta`**: Resumo da tarefa em formato `kebab-case` (letras minúsculas, palavras separadas por hífen, sem acentuação, 2 a 5 palavras).

### Cenário de Exceção (Sem Issue):
Em casos pontuais onde não há issue aberta (ex.: pequenas correções de documentação ou prototipação autorizada):
```text
tipo/descricao-curta
```

---

## 3. Tipos Permitidos

| Prefixo | Finalidade | Base de Origem | Destino do PR |
| :--- | :--- | :--- | :--- |
| `feat/` | Nova funcionalidade ou recurso | `develop` | `develop` |
| `fix/` | Correção de bug em ambiente de desenvolvimento | `develop` | `develop` |
| `hotfix/` | Correção crítica e urgente diretamente em produção | `main` | `main` e `develop` |
| `docs/` | Documentação técnica, README, manuais | `develop` | `develop` |
| `refactor/` | Refatoração de código sem alterar comportamento | `develop` | `develop` |
| `test/` | Criação ou ajuste de testes automatizados | `develop` | `develop` |
| `perf/` | Melhorias de desempenho | `develop` | `develop` |
| `chore/` | Tarefas de build, dependências ou ferramentas locais | `develop` | `develop` |
| `ci/` | Integração contínua (GitHub Actions, pipelines) | `develop` | `develop` |

---

## 4. Exemplos Práticos

- `feat/1-cliente-http-token-env`
- `fix/12-banner-503-nao-fecha`
- `hotfix/21-crash-ao-abrir-fluxo`
- `docs/34-documentacao-swagger-openapi`
- `refactor/45-modularizar-vector-store`
- `test/50-adicionar-testes-integrados`

---

## 5. Regras de Ouro do Fluxo de Trabalho

1. **Uma branch = Uma issue:** Nunca misture múltiplos escopos ou requisitos não relacionados na mesma branch. Se o escopo crescer durante o desenvolvimento, crie uma nova issue e uma nova branch.
2. **Sempre atualize a base antes de criar:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/42-nova-funcionalidade
   ```
3. **Mantenha a branch sincronizada:** Faça rebase ou merge periódico de `develop` para evitar conflitos gigantescos no momento do PR.
4. **Remoção pós-merge:** Delete a branch remota e local logo após o Pull Request ser aprovado e integrado (*merged*).
