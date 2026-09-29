# Diretrizes do Agente & Especificação do Projeto: Zelda RAG API

Este arquivo define o papel, a arquitetura, as restrições técnicas e as instruções obrigatórias para o desenvolvimento do projeto **Zelda Knowledge RAG API**. Qualquer agente que atuar neste repositório deve seguir rigorosamente as regras aqui estabelecidas.

---

## 1. Perfil & Papel do Agente

Você atua como um **Engenheiro de Software Sênior**, especialista em:
- **TypeScript** e **Node.js** modernos (ESM, tipagem estrita, boas práticas);
- **APIs REST** robustas, seguras e bem documentadas;
- **LangChain** (versões modernas e modulares em JS/TS);
- **RAG (Retrieval-Augmented Generation)**, embeddings semânticos e vector stores;
- **Arquitetura de Software**, Clean Architecture, SOLID e Design Patterns.

Sua missão é desenvolver e manter um projeto completo, organizado, testável, executável e pronto para desenvolvimento local utilizando TypeScript e LangChain.

---

## 2. Objetivo do Projeto

Construir uma API REST capaz de responder perguntas sobre o universo de **The Legend of Zelda** utilizando uma base de conhecimento interna localizada na raiz do projeto (`knowledge/`).

### Requisitos Funcionais do Sistema:
1. **Leitura e Extração:** Carregar múltiplos arquivos da base de conhecimento (`.txt`, `.md`).
2. **Chunking:** Processar e dividir o conteúdo em fragmentos (*chunks*) semanticamente coerentes.
3. **Embeddings:** Gerar vetores numéricos representativos de cada fragmento.
4. **Armazenamento Vetorial:** Persistir os embeddings em um *vector store* com suporte a execução local (sem infraestrutura pesada ou dependências externas obrigatórias).
5. **Recuperação Semântica (Retriever):** Buscar os trechos mais relevantes para a pergunta do usuário.
6. **Síntese Aumentada por Recuperação (RAG):** Montar o prompt contextualizado e enviar ao LLM.
7. **Resposta Fiel (Zero Alucinação):** Responder baseando-se **exclusivamente** no contexto recuperado.
8. **Interface HTTP:** Disponibilizar rotas REST para que clientes façam perguntas e monitorem a saúde do serviço.

---

## 3. Stack Tecnológica Obrigatória

| Tecnologia | Finalidade | Regras de Uso |
| :--- | :--- | :--- |
| **TypeScript** | Linguagem principal | `strict: true`, proibir `any`, tipagem forte em contratos e DTOs. |
| **Node.js** | Runtime | Versão LTS moderna (Node 18+ ou 20+). |
| **LangChain (JS/TS)** | Framework de IA & RAG | Utilizar pacotes modernos (`@langchain/core`, etc.). Não usar APIs depreciadas. |
| **Express** ou **Fastify** | Servidor HTTP / API REST | Separação de controllers, rotas, middlewares e validação de schema. |
| **Vector Store Local** | Banco de dados vetorial | Usar solução executável localmente (ex.: HNSWLib, MemoryVectorStore persistido ou similar). |
| **Dotenv / Zod** | Configurações sensíveis | Centralização em `src/config/env.ts` com validação de runtime. |

---

## 4. Estrutura de Diretórios Esperada

O projeto deve manter separação clara de responsabilidades:

```text
project-root/
├── knowledge/                        # Base de conhecimento interna (arquivos de texto/markdown)
│   ├── characters.md
│   ├── games.md
│   └── lore.md
├── src/
│   ├── config/                       # Configurações de ambiente tipadas e validadas
│   │   └── env.ts
│   ├── controllers/                  # Adaptadores de entrada HTTP (validação de request, resposta)
│   │   ├── health.controller.ts
│   │   └── question.controller.ts
│   ├── routes/                       # Definição e registro de rotas HTTP
│   │   ├── health.routes.ts
│   │   ├── question.routes.ts
│   │   └── index.ts
│   ├── services/                     # Casos de uso e orquestração de domínio
│   │   ├── ingestion.service.ts
│   │   ├── embedding.service.ts
│   │   └── question.service.ts
│   ├── rag/                          # Componentes centrais do fluxo RAG
│   │   ├── vector-store.ts           # Inicialização e persistência do Vector Store local
│   │   ├── retriever.ts              # Configuração do retriever semântico
│   │   ├── prompts.ts                # Templates de prompt explícitos e blindados
│   │   └── chain.ts                  # Montagem da RAG Chain (LangChain)
│   ├── middlewares/                  # Tratamento global de erros, rate limiting, logging
│   │   └── error-handler.middleware.ts
│   ├── app.ts                        # Configuração da aplicação Express/Fastify (rotas, middlewares)
│   └── server.ts                     # Ponto de entrada (Composition Root & Inicialização do HTTP Server)
├── scripts/
│   └── ingest.ts                     # Script CLI independente para pipeline de ingestão
├── test/                             # Testes automatizados (unitários e de integração com mocks)
│   ├── question.service.spec.ts
│   └── health.controller.spec.ts
├── .env.example                      # Template de variáveis de ambiente obrigatórias
├── .gitignore                        # Ignora .env, node_modules, dist, dados de vetores
├── package.json                      # Scripts de execução e dependências
├── tsconfig.json                     # Configurações estritas do TypeScript
└── README.md                         # Documentação completa de instalação, execução e arquitetura
```

---

## 5. Pipeline de Ingestão (`scripts/ingest.ts`)

A ingestão é **totalmente desacoplada** do ciclo de vida da API:

```text
knowledge/ (*.txt, *.md)
       ↓
Document Loaders (preserva metadados: source, type)
       ↓
Text Splitter (RecursiveCharacterTextSplitter)
       ↓
Chunks de texto
       ↓
Embedding Model
       ↓
Local Vector Store (Persistido em disco)
```

### Regras Críticas de Ingestão:
1. **Comando Dedicado:** A ingestão deve ser executada exclusivamente via `npm run ingest`.
2. **Não re-executar no startup:** O comando `npm run dev` **NÃO** deve gerar embeddings nem varrer a pasta `knowledge/`. Ele apenas carrega o índice vetorial previamente persistido.
3. **Múltiplos Documentos e Extensões:** Suportar `.txt` e `.md` na pasta `knowledge/`, preservando metadados úteis (`source`, `type`).
4. **Custo e Performance:** Nunca gerar embeddings a cada requisição HTTP recebida pela API.

---

## 6. Especificação da API REST

### 6.1. Endpoint de Perguntas: `POST /questions`

#### Request Body
```json
{
  "question": "Quem é Link?"
}
```

#### Regras de Validação do Request
- `body` deve ser obrigatório e um JSON válido.
- `question` deve ser string, não vazia, sem conter apenas espaços em branco.
- Deve haver limite razoável de tamanho na pergunta (ex.: máximo 500 caracteres).
- Caso inválido, retornar HTTP `400 Bad Request` no formato padronizado.

#### Response Body (`200 OK`)
```json
{
  "answer": "Link é o herói lendário de Hyrule e protagonista da franquia...",
  "sources": [
    {
      "source": "knowledge/characters.md"
    },
    {
      "source": "knowledge/lore.md"
    }
  ]
}
```

#### Regras de Fontes (*Sources*):
- **Deduplicação:** Não retornar a mesma fonte repetida no array `sources`.
- **Metadados:** Se o retriever fornecer métricas confiáveis (score/distância), incluí-las. Não inventar valores fictícios.

---

### 6.2. Endpoint de Saúde: `GET /health`

#### Response Body (`200 OK`)
```json
{
  "status": "ok",
  "vectorStore": {
    "loaded": true
  }
}
```

---

### 6.3. Padrão Unificado de Respostas de Erro

A API **nunca** deve vazar stack traces, caminhos internos do servidor ou chaves de API.

Formato canônico:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The question field is required and must not be empty."
  }
}
```

Status Codes:
- `400`: Entrada inválida ou ausente (`INVALID_REQUEST`).
- `404`: Rota inexistente (`NOT_FOUND`).
- `503`: Vector store ainda não inicializado ou não ingerido (`VECTOR_STORE_NOT_INITIALIZED`).
- `500`: Erro interno no LLM ou servidor (`INTERNAL_SERVER_ERROR`).

---

## 7. Arquitetura RAG & Prompt Engineering

### Prompt Template Obrigatório
O prompt deve garantir fidelidade estrita ao contexto recuperado:

```text
Você é um assistente especializado no universo de The Legend of Zelda.

Responda à pergunta do usuário utilizando exclusivamente as informações presentes no contexto fornecido abaixo.
Se a resposta não estiver presente no contexto, responda estritamente: "Não encontrei informações suficientes na base de conhecimento sobre The Legend of Zelda para responder a esta pergunta."
Não tente inventar, extrapolar ou utilizar informações de fora do contexto.

Contexto:
{context}

Pergunta:
{question}

Resposta:
```

### Configuração do Retriever:
- O número de fragmentos recuperados (`k`) deve ter padrão sensato (ex.: `k = 4`), sendo configurável via variável de ambiente (`RAG_TOP_K`).

---

## 8. Variáveis de Ambiente & Segurança

### Template `.env.example`
```env
PORT=3000
NODE_ENV=development

# LLM & Embeddings Provider (OpenAI ou compatível)
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# RAG & Vector Store Configuration
VECTOR_STORE_PATH=./data/vector_store
RAG_TOP_K=4
```

### Regras de Segurança:
- Adicionar `.env` e diretórios de dados locais ao `.gitignore`.
- Nunca commitar chaves de API nem segredos.
- Não expor variáveis sensíveis nos logs da aplicação.

---

## 9. Observabilidade & Logs

Implementar logs informativos e limpos no console:
```text
[INFO] Loading vector store from ./data/vector_store...
[INFO] Vector store loaded successfully.
[INFO] Question received: "Quem é Link?"
[INFO] Documents retrieved: 3
[INFO] Answer generated successfully in 840ms.
```

---

## 10. Testes Automatizados

Configurar suíte de testes (Vitest ou Jest) priorizando:
1. Validação de inputs do `question.controller` (requisição vazia, tipos incorretos).
2. Comportamento do `question.service` quando não há documentos no contexto recuperado.
3. Resposta do endpoint `GET /health`.
4. Mocks para chamadas de LLM e Embeddings, evitando custos e dependência de rede durante a execução dos testes (`npm test`).

---

## 11. Scripts no `package.json`

O `package.json` deve fornecer os seguintes scripts funcionais:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "ingest": "tsx scripts/ingest.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

---

## 12. Critérios de Aceite (Definition of Done)

O projeto estará formalmente concluído apenas quando o seguinte fluxo puder ser executado com sucesso:

1. `npm install` instala todas as dependências sem erros.
2. `npm run ingest` lê `knowledge/`, divide o texto, gera embeddings e salva o vector store localmente.
3. `npm run dev` inicializa o servidor sem re-executar embeddings.
4. Requisição HTTP de teste:
   ```bash
   curl -X POST http://localhost:3000/questions \
     -H "Content-Type: application/json" \
     -d '{"question":"Quem é Zelda?"}'
   ```
   Retorna a resposta contextualizada e a lista de fontes deduplicadas.
5. Requisição HTTP de saúde:
   ```bash
   curl -X GET http://localhost:3000/health
   ```
   Retorna status `200 OK` informando que o serviço e o vector store estão operacionais.
6. `npm run typecheck` executa sem nenhum erro de compilação TypeScript.
