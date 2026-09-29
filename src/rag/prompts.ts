import { PromptTemplate } from '@langchain/core/prompts';

export const NO_CONTEXT_FALLBACK =
  'Não encontrei informações suficientes na base de conhecimento sobre The Legend of Zelda para responder a esta pergunta.';

export const ZELDA_RAG_PROMPT_TEMPLATE = `Você é um assistente especializado no universo de The Legend of Zelda.

Responda à pergunta do usuário utilizando exclusivamente as informações presentes no contexto fornecido abaixo.
Se a resposta não estiver presente no contexto, responda estritamente: "Não encontrei informações suficientes na base de conhecimento sobre The Legend of Zelda para responder a esta pergunta."
Não tente inventar, extrapolar ou utilizar informações de fora do contexto.

Contexto:
{context}

Pergunta:
{question}

Resposta:`;

export const zeldaPromptTemplate = PromptTemplate.fromTemplate(ZELDA_RAG_PROMPT_TEMPLATE);
