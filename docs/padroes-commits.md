# Guia Completo de Padrões de Commits

Este documento define a convenção oficial de mensagens de commit para o repositório, combinando os princípios do **Conventional Commits** com **Gitmoji** em língua portuguesa (pt-BR).

---

## 1. Estrutura Padrão

Toda mensagem de commit deve seguir a seguinte anatomia:

```text
:emoji: <tipo>[escopo opcional]: <Descrição curta e imperativa>

[Corpo opcional explicando o motivo, impactos e contexto da mudança]

[Rodapé opcional com referências, cards ou revisores]
```

### Exemplo Básico:
```text
:sparkles: feat: Criação da estrutura com Shadcn UI
```

### Exemplo Completo com Escopo, Corpo e Rodapé:
```text
:sparkles: feat(auth): Adiciona autenticação via JWT com refresh token

Implementa o fluxo de geração e validação de tokens JWT para o endpoint de login.
Tokens expiram em 15 minutos e refresh tokens são persistidos de forma segura no Redis.

Reviewed-by: DevSênior Refs #142
```

---

## 2. Regras e Boas Práticas

1. **Emoji Obrigatório no Início:** Sempre no formato textual `:codigo:` para renderização correta em plataformas como GitHub e GitLab.
2. **Descrição em Português (pt-BR):** Sucinta e clara, iniciando com letra maiúscula ou minúscula consistente, sem ponto final na primeira linha.
3. **Limite da Primeira Linha:** Recomenda-se manter a primeira linha em até 72 caracteres.
4. **Corpo Explicativo:** Utilize o corpo para explicar **o porquê** da alteração, e não apenas o que o código já mostra.
5. **Links e Referências:** Sempre na forma autêntica e sem encurtadores de URL.

---

## 3. Tabela Completa de Tipos e Emojis

| Tipo | Emoji | Código do Emoji | Descrição e Quando Usar |
| :--- | :---: | :--- | :--- |
| `feat` | ✨ | `:sparkles:` | Inclusão de uma nova funcionalidade ou recurso para o usuário. |
| `fix` | 🐛 | `:bug:` | Correção de um bug, falha ou comportamento inesperado. |
| `docs` | 📚 | `:books:` | Alterações exclusivas na documentação (README, manuais, guias). |
| `test` | 🧪 | `:test_tube:` | Criação, atualização ou refatoração de testes automatizados. |
| `build` | 📦 | `:package:` | Mudanças que afetam o sistema de compilação ou dependências externas (npm, package.json). |
| `refactor` | ♻️ | `:recycle:` | Refatoração de código que não altera a funcionalidade externa nem corrige bugs. |
| `perf` | ⚡ | `:zap:` | Mudança de código que melhora o desempenho ou reduz consumo de recursos. |
| `style` | 🎨 | `:art:` | Alterações que não afetam o significado do código (espaçamento, formatação, lint). |
| `chore` | 🔧 | `:wrench:` | Tarefas rotineiras de manutenção, configuração e ferramentas de desenvolvimento. |
| `ci` | 🧱 | `:bricks:` | Alterações em arquivos de configuração e scripts de CI/CD (GitHub Actions, etc.). |
| `revert` | ⏪ | `:rewind:` | Reversão de um ou mais commits anteriores. |
| `security` | 🔒 | `:lock:` | Correção ou aprimoramento relacionado à segurança ou vulnerabilidades. |

---

## 4. Exemplos Práticos por Cenário

- **Documentação:**
  `:books: docs: Atualização do README com instruções de instalação`
- **Correção de Bug:**
  `:bug: fix: Tratamento de divisão por zero na linha 50`
- **Nova Feature:**
  `:sparkles: feat: Implementa endpoint de perguntas com RAG`
- **Refatoração:**
  `:recycle: refactor: Substitui loops imperativos por map e reduce`
- **Dependências:**
  `:package: build: Adiciona swagger-ui-express e tipos correspondentes`
- **Testes:**
  `:test_tube: test: Adiciona testes unitários para o controlador de saúde`
