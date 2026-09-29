import {
  BaseChatModel,
  SimpleChatModel,
} from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { env } from '../config/env';
import { NO_CONTEXT_FALLBACK, zeldaPromptTemplate } from './prompts';
import {
  extractDeduplicatedSources,
  formatDocumentsAsString,
  FormattedSource,
} from './retriever';
import { LocalFileVectorStore } from './vector-store';

export interface RagResult {
  answer: string;
  sources: FormattedSource[];
  retrievedCount: number;
}

/**
 * MockChatModel
 * Provides contextual answers based on the prompt's context in offline/test mode.
 * Extends LangChain's SimpleChatModel.
 */
export class MockChatModel extends SimpleChatModel {
  _llmType(): string {
    return 'mock-chat-model';
  }

  async _call(messages: BaseMessage[]): Promise<string> {
    const promptText = messages
      .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
      .join('\n');

    const questionMatch = promptText.match(/Pergunta:\s*([^\n\r]+)/i);
    const question = questionMatch ? questionMatch[1]!.toLowerCase() : promptText.toLowerCase();

    let answer = NO_CONTEXT_FALLBACK;

    if (question.includes('link')) {
      answer =
        'Link é o lendário herói de Hyrule e protagonista principal da franquia The Legend of Zelda. Portador da Triforce da Coragem, ele empunha a Master Sword para proteger Hyrule e resgatar a princesa Zelda.';
    } else if (question.includes('zelda')) {
      answer =
        'A Princesa Zelda é a governante mortal de Hyrule, descendente direta da deusa Hylia e portadora da Triforce da Sabedoria. Ela desempenha papéis vitais em toda a franquia e possui poderes sagrados de selamento.';
    } else if (question.includes('ganon') || question.includes('ganondorf')) {
      answer =
        'Ganondorf é o Rei dos Ladrões Gerudo, encarnação mortal do rancor do Rei Demônio Demise e portador da Triforce do Poder. Em sua forma monstruosa, é conhecido como Ganon.';
    } else if (question.includes('triforce')) {
      answer =
        'A Triforce é o artefato supremo deixado pelas Deusas Douradas (Din, Nayru e Farore). É composta pela Triforce do Poder, Sabedoria e Coragem.';
    } else if (question.includes('master sword') || question.includes('espada')) {
      answer =
        'A Master Sword é a lendária Espada que Bane a Escuridão, forjada originalmente como Goddess Sword e abençoada pelas chamas sagradas para repelir o mal.';
    } else if (
      question.includes('hyrule') ||
      question.includes('ocarina') ||
      question.includes('impa') ||
      question.includes('midna') ||
      question.includes('epona')
    ) {
      answer =
        'Com base no universo de The Legend of Zelda, a informação recuperada no contexto detalha a história, os personagens e a cronologia deste reino.';
    } else {
      answer = NO_CONTEXT_FALLBACK;
    }

    return answer;
  }
}

/**
 * Creates the LLM instance (OpenAI or Mock fallback for testing/offline).
 */
export function createChatModel(options?: {
  apiKey?: string;
  modelName?: string;
  useMock?: boolean;
}): BaseChatModel {
  const useMock =
    options?.useMock ??
    env.MOCK_LLM ??
    (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'your_api_key_here');
  const apiKey = options?.apiKey ?? env.OPENAI_API_KEY;
  const modelName = options?.modelName ?? env.OPENAI_MODEL;

  if (useMock || !apiKey || apiKey === 'your_api_key_here') {
    return new MockChatModel({});
  }

  return new ChatOpenAI({
    apiKey,
    model: modelName,
    temperature: 0.1, // Low temperature for high fidelity to context
  });
}

/**
 * Assembles and executes the RAG pipeline.
 */
export class ZeldaRagChain {
  private readonly llm: BaseChatModel;
  private readonly vectorStore: LocalFileVectorStore;
  private readonly topK: number;

  constructor(
    vectorStore: LocalFileVectorStore,
    llm: BaseChatModel,
    topK: number = env.RAG_TOP_K
  ) {
    this.vectorStore = vectorStore;
    this.llm = llm;
    this.topK = topK;
  }

  public async execute(question: string): Promise<RagResult> {
    // 1. Semantic retrieval with scores
    const scoredDocs = await this.vectorStore.similaritySearchWithScore(
      question,
      this.topK
    );

    // Filter out matches with zero or negligible similarity
    const relevantDocs = scoredDocs.filter(([, score]) => score > 0.05);

    if (relevantDocs.length === 0) {
      return {
        answer: NO_CONTEXT_FALLBACK,
        sources: [],
        retrievedCount: 0,
      };
    }

    // 2. Format context for prompt
    const documents = relevantDocs.map(([doc]) => doc);
    const context = formatDocumentsAsString(documents);

    // 3. Assemble LCEL chain: prompt | llm | parser
    const outputParser = new StringOutputParser();
    const chain = RunnableSequence.from([zeldaPromptTemplate, this.llm, outputParser]);

    // 4. Invoke LLM with strict context and question
    const answer = await chain.invoke({
      context,
      question,
    });

    // 5. Extract and deduplicate sources
    const sources = extractDeduplicatedSources(
      relevantDocs.map(([document, score]) => ({ document, score }))
    );

    return {
      answer: answer.trim(),
      sources,
      retrievedCount: relevantDocs.length,
    };
  }
}
