# Guia Completo de Padrões para Criação de Issues

Este guia define o padrão obrigatório para criação de issues no GitHub para este repositório. Toda issue deve ser clara, acionável, testável e conter contexto suficiente para que qualquer engenheiro possa compreendê-la e implementá-la sem necessidade de esclarecimentos adicionais.

---

## 1. Padrão de Título

O título da issue deve iniciar obrigatoriamente com a tag do tipo em maiúsculas entre colchetes, seguido de uma descrição sucinta em pt-BR:

```text
[TYPE] Descrição curta e objetiva
```

### Tipos Permitidos:
- **`[FEATURE]`**: Criação de um novo recurso, funcionalidade ou capacidade que não existia no produto.
- **`[ENHANCEMENT]`**: Melhoria, expansão ou refinamento de uma funcionalidade existente.
- **`[BUG]`**: Correção de comportamento defeituoso, falha de runtime, erro de lógica ou regressão.
- **`[TECH]`**: Débito técnico, refatoração de arquitetura, atualização de infraestrutura, pipelines ou dependências.

**Exemplos:**
- `[FEATURE] Adicionar suporte a busca híbrida no Vector Store`
- `[ENHANCEMENT] Melhorar mensagens de erro de validação do endpoint /questions`
- `[BUG] Endpoint /health reporta status incorreto quando o índice está vazio`
- `[TECH] Atualizar dependências do LangChain para a versão mais recente`

---

## 2. Estrutura Obrigatória do Corpo

Toda issue deve conter, no mínimo, as seguintes 4 seções:

### 1. Contexto de Negócio
Explica **por que** este trabalho é necessário, qual o valor gerado para o usuário final ou para a equipe técnica e como se alinha aos objetivos do projeto.

### 2. Declaração do Problema
Descreve a situação atual, as dores observadas, os comportamentos anômalos ou as lacunas do sistema.

### 3. Solução Esperada
Apresenta o comportamento final desejado, a abordagem técnica recomendada ou os resultados pretendidos.

### 4. Critérios de Aceitação
Uma lista de verificação objetiva e testável com caixas de seleção (`- [ ]`), definindo exatamente as condições para que a issue seja considerada concluída.

---

## 3. Seções Complementares (Quando Aplicável)

### Cenários BDD (Behavior-Driven Development)
Sempre que houver regras de negócio ou fluxos com entradas e saídas específicas, inclua cenários em formato Gherkin (sucesso e falha):

```gherkin
Cenário: Pergunta com sucesso sobre personagem
  Dado que o vector store está inicializado com a base de conhecimento de Zelda
  Quando o cliente envia POST /questions com '{"question": "Quem é Link?"}'
  Então a resposta deve ter status HTTP 200
  E o corpo deve conter 'answer' e o array 'sources' com pelo menos 'knowledge/characters.md'

Cenário: Pergunta fora do universo da base de conhecimento
  Dado que o vector store está ativo
  Quando o cliente envia POST /questions com uma pergunta sobre física quântica
  Então a resposta deve conter a mensagem de fallback de zero alucinação
```

### Requisitos Não Funcionais
Especifique limites de latência, consumo de memória, concorrência, compatibilidade ou segurança quando relevante.

### Fora de Escopo
Deixe explícito o que **não** será resolvido nesta issue para evitar aumento descontrolado de escopo (*scope creep*).

### Diagramas Explicativos
Para fluxos complexos, diagramas de arquitetura ou sequência:
1. Gere o diagrama via Mermaid com o agente especializado `diagram-specialist`.
2. Nunca commite o código-fonte cru ou binários no repositório.
3. Faça upload do arquivo PNG renderizado no bucket `s3://maria-langgraph-pp-docs-185327115563/diagramas/`.
4. Embuta a URL pública resultante no corpo da issue.

---

## 4. Template Completo para Cópia

```markdown
## 1. Contexto de Negócio
<!-- Por que este trabalho é necessário? Qual o objetivo e valor gerado? -->

## 2. Declaração do Problema
<!-- Qual a situação atual ou a falha observada? -->

## 3. Solução Esperada
<!-- Como o sistema deve se comportar após a implementação? -->

## 4. Critérios de Aceitação
- [ ] O endpoint aceita X e valida Y
- [ ] Testes unitários cobrindo o fluxo de sucesso
- [ ] Testes cobrindo os cenários de erro
- [ ] Documentação atualizada (README/Swagger)

## 5. Cenários BDD (Opcional)
```gherkin
Cenário: ...
  Dado ...
  Quando ...
  Então ...
```

## 6. Fora de Escopo (Opcional)
- Não inclui ...
```

---

## 5. Checklist de Qualidade da Issue

Antes de publicar uma issue no GitHub, garanta que:
- [ ] O título segue o formato `[TYPE] Descrição objetiva`.
- [ ] As 4 seções obrigatórias estão preenchidas sem jargões ambíguos.
- [ ] Os critérios de aceitação são claros, objetivos e verificáveis por testes automatizados.
- [ ] Não há ambiguidades ou requisitos não informados que forcem suposições durante o desenvolvimento.
