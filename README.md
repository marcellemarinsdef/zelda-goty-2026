# Zelda Knowledge RAG API

API REST de Recuperação Aumentada por Geração (**RAG - Retrieval-Augmented Generation**) construída com **TypeScript**, **Node.js** e **LangChain**, especializada em responder perguntas sobre o universo de **The Legend of Zelda** baseando-se estritamente em uma base de conhecimento local.

---

## 1. Descrição do Projeto

O objetivo deste projeto é fornecer uma API inteligente, robusta e fiel para consultas sobre o folclore, personagens, artefatos sagrados e jogos da franquia *The Legend of Zelda*.

### Diferenciais de Arquitetura:
- **Zero Alucinações:** O sistema responde exclusivamente com base no contexto recuperado da base de conhecimento interna (`knowledge/`). Caso a informação não exista, retorna uma mensagem canônica clara em vez de inventar.
- **Ingestão Desacoplada:** O processo de leitura, chunking e geração de embeddings é executado sob demanda (`npm run ingest`). O servidor da API (`npm run dev`) apenas carrega o índice persistido em disco, evitando custos desnecessários de API e lentidão no startup.
- **Vector Store Local Persistido:** Implementação de Vector Store em disco sem dependência de banco de dados vetorial pesado em nuvem para desenvolvimento local.
- **Tipagem Estrita e Clean Architecture:** Código 100% TypeScript com `strict: true`, separação de responsabilidades (Controllers, Services, RAG Chain, Repositories/Adapters) e tratamento centralizado de erros.

---

## 2. Requisitos de Ambiente

- **Node.js:** Versão 18+ (recomendado Node 20+ ou 24+)
- **NPM:** Versão 9+
- **Chave de API da OpenAI (Opcional para desenvolvimento):** Caso não possua ou não configure uma chave no `.env`, o sistema opera automaticamente em modo de desenvolvimento/mock local determinístico, permitindo testar toda a API offline sem custos!

---

## 3. Instalação

Clone o repositório e instale as dependências:

```bash
npm install
```

---

## 4. Configuração de Variáveis de Ambiente

Copie o arquivo de exemplo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Configurações disponíveis no `.env`:

```env
PORT=3000
NODE_ENV=development

# Provedor LLM e Embeddings (OpenAI)
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Configurações do Vector Store e RAG
VECTOR_STORE_PATH=./data/vector_store
RAG_TOP_K=4
```

> **Nota:** Caso `OPENAI_API_KEY` não seja fornecida ou mantenha o valor padrão `your_api_key_here`, a aplicação utilizará provedores locais em memória com embeddings determinísticos para possibilitar testes locais e execução de CI/CD.

---

## 5. Pipeline de Ingestão de Conhecimento

Antes de iniciar a API pela primeira vez, processe a base de conhecimento localizada na pasta `knowledge/` (`.txt` e `.md`):

```bash
npm run ingest
```

Esse comando irá:
1. Ler recursivamente todos os arquivos `.md` e `.txt` em `knowledge/`;
2. Dividir os textos em fragmentos semânticos (*chunks*) via `RecursiveCharacterTextSplitter`;
3. Gerar os vetores de embedding;
4. Persistir o índice vetorial no diretório local configurado (`./data/vector_store/index.json`).

---

## 6. Executando a API

### Modo de Desenvolvimento (com Hot-Reload)
```bash
npm run dev
```

### Modo de Produção
```bash
npm run build
npm start
```

---

## 7. Documentação Interativa Swagger & Testes

### 7.1. Interface Swagger UI
Acesse a documentação interativa OpenAPI diretamente pelo navegador:
- **Swagger UI:** [http://localhost:3000/docs](http://localhost:3000/docs) (ou porta `3001` caso alterada no `.env`)
- **Especificação OpenAPI JSON:** [http://localhost:3000/docs.json](http://localhost:3000/docs.json)

---

### 7.2. Verificação de Saúde (`GET /health`)
```bash
curl -X GET http://localhost:3000/health
```

**Resposta esperada (200 OK):**
```json
{
  "status": "ok",
  "vectorStore": {
    "loaded": true,
    "records": 39
  }
}
```

---

### 7.2. Fazer uma Pergunta sobre Zelda (`POST /questions`)

#### Pergunta sobre o protagonista Link:
```bash
curl -X POST http://localhost:3000/questions \
  -H "Content-Type: application/json" \
  -d '{"question": "Quem é Link?"}'
```

**Resposta esperada (200 OK):**
```json
{
  "answer": "Link é o lendário herói de Hyrule e protagonista principal da franquia The Legend of Zelda...",
  "sources": [
    {
      "source": "knowledge/characters.md",
      "score": 0.7869
    },
    {
      "source": "knowledge/timeline.txt",
      "score": 0.6876
    }
  ]
}
```

#### Pergunta sobre a Princesa Zelda:
```bash
curl -X POST http://localhost:3000/questions \
  -H "Content-Type: application/json" \
  -d '{"question": "Quem é a Princesa Zelda?"}'
```

---

### 7.3. Teste de Blindagem contra Alucinação

Perguntas que não constam no universo de The Legend of Zelda acionam o fallback estrito:

```bash
curl -X POST http://localhost:3000/questions \
  -H "Content-Type: application/json" \
  -d '{"question": "Qual é a teoria da relatividade geral de Einstein?"}'
```

**Resposta:**
```json
{
  "answer": "Não encontrei informações suficientes na base de conhecimento sobre The Legend of Zelda para responder a esta pergunta.",
  "sources": [...]
}
```

---

### 7.4. Validação de Erros de Entrada (`400 Bad Request`)

#### Pergunta vazia:
```bash
curl -X POST http://localhost:3000/questions \
  -H "Content-Type: application/json" \
  -d '{"question": ""}'
```

**Resposta:**
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The question field is required and must not be empty."
  }
}
```

---

## 8. Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE DE INGESTÃO                     │
│                     (npm run ingest)                        │
│                                                             │
│   knowledge/ (*.md, *.txt)                                  │
│              ↓                                              │
│   Document Loader (extrai texto + metadados: source, type)  │
│              ↓                                              │
│   RecursiveCharacterTextSplitter (chunkSize: 600, overlap)  │
│              ↓                                              │
│   Embedding Service (OpenAI / Deterministic Mock)           │
│              ↓                                              │
│   LocalFileVectorStore ──► [Salva em ./data/vector_store]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       FLUXO DA API REST                     │
│                        (npm run dev)                        │
│                                                             │
│   HTTP Client (POST /questions)                             │
│              ↓                                              │
│   QuestionController (Validação Zod de schema e payload)    │
│              ↓                                              │
│   QuestionService (Orquestrador de Caso de Uso)             │
│              ↓                                              │
│   Retriever Semântico ◄── [Carrega ./data/vector_store]     │
│              ↓ (Documentos com métricas de similaridade)    │
│   Prompt Blindado (Anti-Alucinação)                         │
│              ↓                                              │
│   LLM (ChatOpenAI / Mock)                                   │
│              ↓                                              │
│   JSON Response { answer, sources (deduplicadas) }          │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Diretórios
```text
.
├── knowledge/                        # Base de conhecimento de Zelda (.md, .txt)
│   ├── characters.md
│   ├── games.md
│   ├── lore.md
│   └── timeline.txt
├── src/
│   ├── config/                       # Validação tipada de runtime (Zod / Dotenv)
│   │   └── env.ts
│   ├── controllers/                  # Adaptadores de entrada HTTP
│   │   ├── health.controller.ts
│   │   └── question.controller.ts
│   ├── core/                         # Classes base de erro e contratos
│   │   └── errors/
│   │       └── app-error.ts
│   ├── middlewares/                  # Tratamento global de erros e 404
│   │   └── error-handler.middleware.ts
│   ├── rag/                          # Componentes centrais de RAG
│   │   ├── chain.ts                  # Montagem da LCEL Chain
│   │   ├── prompts.ts                # Template blindado de prompt
│   │   ├── retriever.ts              # Utilitários de recuperação e deduplicação
│   │   └── vector-store.ts           # Vector Store local persistido em disco
│   ├── routes/                       # Roteamento Express
│   │   ├── health.routes.ts
│   │   ├── index.ts
│   │   └── question.routes.ts
│   ├── services/                     # Serviços de domínio e orquestração
│   │   ├── embedding.service.ts
│   │   ├── ingestion.service.ts
│   │   └── question.service.ts
│   ├── app.ts                        # Configuração da aplicação Express
│   └── server.ts                     # Ponto de entrada (Composition Root)
├── scripts/
│   └── ingest.ts                     # Script CLI independente de ingestão
├── test/                             # Testes automatizados com Vitest
│   ├── health.controller.spec.ts
│   ├── ingestion.service.spec.ts
│   ├── question.controller.spec.ts
│   └── question.service.spec.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 9. Testes Automatizados

Os testes automatizados cobrem validação de entrada, serviços de domínio, ingestão de dados, respostas de saúde e isolamento sem custos de API:

```bash
# Executa todos os testes unitários e de integração
npm test

# Verificação estrita de tipagem TypeScript
npm run typecheck
```
