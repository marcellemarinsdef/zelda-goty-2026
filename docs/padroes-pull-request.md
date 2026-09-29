# Guia Completo de Padrões de Pull Request (PR)

Este documento estabelece as diretrizes obrigatórias para abertura, revisão e integração de Pull Requests neste repositório.

---

## 1. Regras Gerais & Destino

| Tipo de Branch de Origem | Destino Obrigatório do PR | Estratégia de Merge |
| :--- | :--- | :--- |
| **Branch de trabalho** (`feat/*`, `fix/*`, `docs/*`, etc.) | `develop` | **Squash and merge** |
| **Branch de hotfix** (`hotfix/*`) | `main` *(e posterior merge em `develop`)* | **Squash and merge** |
| **Release de versão** (`develop`) | `main` | **Merge commit** *(nunca squash!)* |

### Princípios Fundamentais:
- **Um PR = Uma Issue:** Cada PR deve resolver uma única issue específica. Mantenha o PR pequeno, focado e fácil de revisar (idealmente menos de 400 linhas alteradas).
- **Idioma:** Todo o conteúdo do PR (título, descrição, passos de teste) deve ser escrito em **pt-BR**.
- **Automação & CI:** O merge só pode ser concluído após todos os testes e verificações de CI (linters, typecheck, testes unitários) passarem com sucesso.
- **Limpeza:** A branch de trabalho deve ser excluída imediatamente após a conclusão do merge.

---

## 2. Padrão de Título do PR

O título deve seguir a mesma convenção dos commits do repositório:

```text
:emoji: tipo: Descrição curta e objetiva
```

### Exemplos:
- `:sparkles: feat: Implementa endpoint de perguntas com LangChain RAG`
- `:bug: fix: Corrige validação de payload vazio no controlador de perguntas`
- `:books: docs: Adiciona documentação interativa Swagger/OpenAPI`
- `:recycle: refactor: Isola lógica de similaridade de cosseno em serviço dedicado`
- `:package: build: Atualiza dependências do LangChain e adiciona vitest`

---

## 3. Template Obrigatório do Corpo do PR

Ao abrir um Pull Request, utilize o template a seguir preenchendo todas as seções:

```markdown
## Resumo
<!-- Descrição breve de 1 a 3 frases explicando o propósito desta entrega. -->

## Issue relacionada
Closes #<numero>

## O que foi feito
<!-- Lista em tópicos das principais alterações técnicas e funcionais implementadas. -->
- 
- 
- 

## Como testar
<!-- Passo a passo claro com comandos, rotas ou dados de entrada para validar a mudança. -->
1. Executar `npm test` para validar a suíte automatizada.
2. Iniciar a aplicação via `npm run dev`.
3. Executar o comando:
   ```bash
   curl -X POST http://localhost:3000/questions \
     -H "Content-Type: application/json" \
     -d '{"question": "Quem é Zelda?"}'
   ```
4. Validar o retorno HTTP 200 com a resposta e as fontes.

## Observações (opcional)
<!-- Notas sobre migrações, variáveis de ambiente novas, impactos colaterais ou pendências futuras. -->
```

---

## 4. Diagramas Explicativos (Opcional)

Para alterações arquiteturais, novos fluxos de dados ou integrações complexas:
1. Gere o diagrama em formato Mermaid utilizando o agente especializado `diagram-specialist`.
2. **Nunca commite o código-fonte cru do diagrama ou binários na árvore do repositório.**
3. Realize o upload do arquivo PNG renderizado para o bucket S3:
   `s3://maria-langgraph-pp-docs-185327115563/diagramas/`
4. Embuta a URL pública resultante diretamente no corpo do Pull Request via sintaxe markdown:
   `![Diagrama de Arquitetura](https://...url-publica-do-diagrama.png)`

---

## 5. Checklist de Verificação Pré-Abertura

Antes de submeter o PR para revisão dos pares:
- [ ] A branch de origem foi criada a partir de `develop` atualizada e segue o padrão `tipo/numero-da-issue-descricao-curta`.
- [ ] O título segue o formato `:emoji: tipo: Descrição curta`.
- [ ] A issue relacionada foi referenciada via `Closes #N`.
- [ ] Todos os testes locais e verificação de tipos executaram com sucesso (`npm test` e `npm run typecheck`).
- [ ] Todos os critérios de aceitação da issue foram plenamente atendidos.
- [ ] Não há chaves de API, segredos, variáveis sensíveis ou arquivos `.env` incluídos no diff.
