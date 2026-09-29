import { env } from './env';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Zelda Knowledge RAG API',
    version: '1.0.0',
    description:
      'API REST com arquitetura **RAG (Retrieval-Augmented Generation)** construída com TypeScript, Node.js e LangChain. Responde a perguntas sobre o universo de **The Legend of Zelda** baseando-se estritamente em uma base de conhecimento local com **zero alucinações**.',
    contact: {
      name: 'Equipe Zelda RAG API',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Servidor Local de Desenvolvimento',
    },
  ],
  tags: [
    {
      name: 'Questions',
      description: 'Consultas semânticas aumentadas por recuperação (RAG) sobre Zelda',
    },
    {
      name: 'Health',
      description: 'Monitoramento de integridade e prontidão do Vector Store',
    },
  ],
  paths: {
    '/questions': {
      post: {
        tags: ['Questions'],
        summary: 'Fazer uma pergunta sobre The Legend of Zelda',
        description:
          'Recebe uma pergunta em linguagem natural, realiza busca vetorial por similaridade de cosseno nos documentos da base de conhecimento (`knowledge/`) e sintetiza uma resposta fiel via LLM.',
        operationId: 'askQuestion',
        requestBody: {
          required: true,
          description: 'Objeto JSON contendo a pergunta do usuário.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/QuestionRequest',
              },
              example: {
                question: 'Quem é Link?',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Pergunta respondida com sucesso utilizando o contexto recuperado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/QuestionResponse',
                },
                example: {
                  answer:
                    'Link é o lendário herói de Hyrule e protagonista principal da franquia The Legend of Zelda. Portador da Triforce da Coragem, ele empunha a Master Sword para proteger Hyrule e resgatar a princesa Zelda.',
                  sources: [
                    {
                      source: 'knowledge/characters.md',
                      score: 0.7869,
                    },
                    {
                      source: 'knowledge/timeline.txt',
                      score: 0.6876,
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Requisição inválida (pergunta ausente, vazia ou superior a 500 caracteres).',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: {
                    code: 'INVALID_REQUEST',
                    message: 'The question field is required and must not be empty.',
                  },
                },
              },
            },
          },
          '503': {
            description: 'Vector store ainda não inicializado em disco.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: {
                    code: 'VECTOR_STORE_NOT_INITIALIZED',
                    message:
                      'Vector store has not been initialized. Please run "npm run ingest" first.',
                  },
                },
              },
            },
          },
          '500': {
            description: 'Erro interno inesperado no servidor ou na chamada ao LLM.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected internal error occurred on the server.',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar status e integridade do serviço',
        description:
          'Retorna o estado operacional da API HTTP e indica se o Vector Store local está carregado com registros na memória.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Serviço operacional.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                example: {
                  status: 'ok',
                  vectorStore: {
                    loaded: true,
                    records: 39,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      QuestionRequest: {
        type: 'object',
        required: ['question'],
        properties: {
          question: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'A pergunta sobre o universo de Zelda.',
            example: 'Quem é a Princesa Zelda?',
          },
        },
      },
      SourceItem: {
        type: 'object',
        required: ['source'],
        properties: {
          source: {
            type: 'string',
            description: 'Caminho relativo do arquivo de origem na base de conhecimento.',
            example: 'knowledge/characters.md',
          },
          score: {
            type: 'number',
            description: 'Métrica de similaridade de cosseno normalizada (opcional).',
            example: 0.7869,
          },
        },
      },
      QuestionResponse: {
        type: 'object',
        required: ['answer', 'sources'],
        properties: {
          answer: {
            type: 'string',
            description: 'Resposta sintetizada pelo LLM com base estrita no contexto.',
            example:
              'A Princesa Zelda é a governante mortal de Hyrule e portadora da Triforce da Sabedoria...',
          },
          sources: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SourceItem',
            },
            description: 'Lista deduplicada de documentos utilizados como contexto.',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['status', 'vectorStore'],
        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },
          vectorStore: {
            type: 'object',
            required: ['loaded', 'records'],
            properties: {
              loaded: {
                type: 'boolean',
                description: 'Indica se os vetores foram carregados com sucesso.',
                example: true,
              },
              records: {
                type: 'integer',
                description: 'Quantidade total de fragmentos (chunks) no índice vetorial.',
                example: 39,
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                description: 'Código de erro padronizado da API.',
                example: 'INVALID_REQUEST',
              },
              message: {
                type: 'string',
                description: 'Mensagem explicativa do erro amigável ao cliente.',
                example: 'The question field is required and must not be empty.',
              },
            },
          },
        },
      },
    },
  },
};
