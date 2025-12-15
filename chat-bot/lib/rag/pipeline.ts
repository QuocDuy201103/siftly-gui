/**
 * RAG Pipeline: Retrieval-Augmented Generation
 * 
 * Flow:
 * 1. Retrieve relevant articles using vector search
 * 2. Calculate confidence score
 * 3. If confidence is low → ask clarifying question or route to human
 * 4. If confidence is high → generate answer using DeepSeek AI with retrieved context
 * 5. Always include citations (links to help articles)
 */

import { searchSimilarArticles, type SearchResult } from "../vector-search";
import { generateChatCompletion, streamChatCompletion, type ChatMessage } from "../deepseek";
import { saveChatMessage } from "../chat-history";
import { getChatHistory } from "../chat-history";

const CONFIDENCE_THRESHOLD = 0.5; // Minimum confidence to answer directly (lowered for better recall)
const LOW_CONFIDENCE_THRESHOLD = 0.2; // Below this, ask for clarification (lowered for better recall)

export interface RAGResponse {
  response: string;
  sources: Array<{
    articleId: string;
    url: string;
    title: string;
  }>;
  confidence: number;
  requiresHuman: boolean;
  clarificationNeeded?: boolean;
}

export interface RAGStreamChunk {
  content?: string;
  done?: boolean;
  sources?: Array<{
    articleId: string;
    url: string;
    title: string;
  }>;
}

/**
 * Generate RAG response (non-streaming)
 */
export async function generateRAGResponse(
  userMessage: string,
  history: ChatMessage[] = [],
  sessionId?: string
): Promise<RAGResponse> {
  // Save user message
  if (sessionId) {
    await saveChatMessage({
      sessionId,
      role: "user",
      content: userMessage,
    });
  }

  // Step 1: Retrieve relevant articles
  const { results, confidence } = await searchSimilarArticles(userMessage);

  // Step 2: Check confidence and decide action
  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    // Very low confidence - route to human
    // Detect language and respond accordingly
    const isVietnamese = /[\u00C0-\u1EF9]/.test(userMessage) || /tiếng|việt|sao|gì|nào|làm|thế/i.test(userMessage);
    const response = isVietnamese 
      ? "Tôi không có đủ thông tin để trả lời câu hỏi của bạn một cách chính xác. Bạn có muốn tôi kết nối bạn với nhân viên hỗ trợ không?"
      : "I'm not sure I have enough information to answer your question accurately. Would you like me to connect you with a human support agent who can help you better?";
    
    const ragResponse: RAGResponse = {
      response,
      sources: [],
      confidence,
      requiresHuman: true,
      clarificationNeeded: false,
    };

    // Save assistant response
    if (sessionId) {
      await saveChatMessage({
        sessionId,
        role: "assistant",
        content: response,
        confidence,
        requiresHuman: true,
      });
    }

    return ragResponse;
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    // Low confidence - ask clarifying question
    const clarifyingQuestion = generateClarifyingQuestion(userMessage, results);
    
    const ragResponse: RAGResponse = {
      response: clarifyingQuestion,
      sources: results.map(r => ({
        articleId: r.articleId,
        url: r.url,
        title: r.title,
      })),
      confidence,
      requiresHuman: false,
      clarificationNeeded: true,
    };

    // Save assistant response
    if (sessionId) {
      await saveChatMessage({
        sessionId,
        role: "assistant",
        content: clarifyingQuestion,
        sources: ragResponse.sources,
        confidence,
      });
    }

    return ragResponse;
  }

  // Step 3: High confidence - generate answer with context
  const context = buildContextFromResults(results);
  const systemPrompt = buildSystemPrompt();
  
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${userMessage}\n\nPlease answer based ONLY on the provided context. If the answer is not in the context, say so.` },
  ];

  const completion = await generateChatCompletion({
    messages,
    temperature: 0.7,
    maxTokens: 2000,
  });

  // Format response with citations
  const responseWithCitations = formatResponseWithCitations(
    completion.content,
    results
  );

  const ragResponse: RAGResponse = {
    response: responseWithCitations,
    sources: results.map(r => ({
      articleId: r.articleId,
      url: r.url,
      title: r.title,
    })),
    confidence,
    requiresHuman: false,
    clarificationNeeded: false,
  };

  // Save assistant response
  if (sessionId) {
    await saveChatMessage({
      sessionId,
      role: "assistant",
      content: responseWithCitations,
      sources: ragResponse.sources,
      confidence,
    });
  }

  return ragResponse;
}

/**
 * Stream RAG response
 */
export async function* streamRAGResponse(
  userMessage: string,
  history: ChatMessage[] = [],
  sessionId?: string
): AsyncGenerator<RAGStreamChunk> {
  // Save user message
  if (sessionId) {
    await saveChatMessage({
      sessionId,
      role: "user",
      content: userMessage,
    });
  }

  // Step 1: Retrieve relevant articles
  const { results, confidence } = await searchSimilarArticles(userMessage);

  // Step 2: Check confidence
  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    const response = "I'm not sure I have enough information to answer your question accurately. Would you like me to connect you with a human support agent who can help you better?";
    
    // Stream the response
    for (const char of response) {
      yield { content: char };
    }

    yield {
      done: true,
      sources: [],
    };

    // Save assistant response
    if (sessionId) {
      await saveChatMessage({
        sessionId,
        role: "assistant",
        content: response,
        confidence,
        requiresHuman: true,
      });
    }
    return;
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    const clarifyingQuestion = generateClarifyingQuestion(userMessage, results);
    
    // Stream the response
    for (const char of clarifyingQuestion) {
      yield { content: char };
    }

    yield {
      done: true,
      sources: results.map(r => ({
        articleId: r.articleId,
        url: r.url,
        title: r.title,
      })),
    };

    // Save assistant response
    if (sessionId) {
      await saveChatMessage({
        sessionId,
        role: "assistant",
        content: clarifyingQuestion,
        sources: results.map(r => ({
          articleId: r.articleId,
          url: r.url,
          title: r.title,
        })),
        confidence,
      });
    }
    return;
  }

  // Step 3: High confidence - stream answer with context
  const context = buildContextFromResults(results);
  const systemPrompt = buildSystemPrompt();
  
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${userMessage}\n\nPlease answer based ONLY on the provided context. If the answer is not in the context, say so.` },
  ];

  let fullResponse = "";

  for await (const chunk of streamChatCompletion({
    messages,
    temperature: 0.7,
    maxTokens: 2000,
  })) {
    if (chunk.content) {
      fullResponse += chunk.content;
      yield { content: chunk.content };
    }
  }

  // Format response with citations
  const responseWithCitations = formatResponseWithCitations(fullResponse, results);

  yield {
    done: true,
    sources: results.map(r => ({
      articleId: r.articleId,
      url: r.url,
      title: r.title,
    })),
  };

  // Save assistant response
  if (sessionId) {
    await saveChatMessage({
      sessionId,
      role: "assistant",
      content: responseWithCitations,
      sources: results.map(r => ({
        articleId: r.articleId,
        url: r.url,
        title: r.title,
      })),
      confidence,
    });
  }
}

/**
 * Build context string from search results
 */
function buildContextFromResults(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      return `[Source ${index + 1}: ${result.title}]\n${result.content}\n`;
    })
    .join("\n---\n\n");
}

/**
 * Build system prompt that enforces answer-only-from-sources
 */
function buildSystemPrompt(): string {
  return `You are a helpful assistant that answers questions based ONLY on the provided context from help articles.

IMPORTANT RULES:
1. Answer ONLY using information from the provided context
2. If the answer is not in the context, explicitly say "I don't have that information in my knowledge base"
3. Never make up information or use knowledge outside the provided context
4. Always cite which source(s) you used when answering
5. Be concise and helpful
6. If asked about something not in the context, suggest the user contact support or ask a clarifying question
7. **ALWAYS respond in the SAME LANGUAGE as the user's question** (e.g., if the user asks in Vietnamese, answer in Vietnamese; if in English, answer in English)`;
}

/**
 * Format response with citations
 */
function formatResponseWithCitations(
  response: string,
  results: SearchResult[]
): string {
  if (results.length === 0) {
    return response;
  }

  // Add citations at the end
  const citations = results
    .map((result, index) => `[${index + 1}] ${result.title} - ${result.url}`)
    .join("\n");

  return `${response}\n\n**Sources:**\n${citations}`;
}

/**
 * Generate clarifying question when confidence is low
 */
function generateClarifyingQuestion(
  userMessage: string,
  results: SearchResult[]
): string {
  // Detect language based on user message
  const isVietnamese = /[\u00C0-\u1EF9]/.test(userMessage) || /tiếng|việt|sao|gì|nào|làm|thế/i.test(userMessage);
  
  if (results.length === 0) {
    return isVietnamese
      ? "Tôi tìm thấy một số bài viết liên quan, nhưng tôi muốn chắc chắn rằng tôi hiểu đúng câu hỏi của bạn. Bạn có thể cung cấp thêm chi tiết về những gì bạn đang tìm kiếm không?"
      : "I found some related articles, but I want to make sure I understand your question correctly. Could you provide more details about what you're looking for?";
  }

  const topics = results.map(r => r.title).join(", ");
  return isVietnamese
    ? `Tôi tìm thấy một số bài viết có thể liên quan: ${topics}. Tuy nhiên, tôi muốn chắc chắn rằng tôi hiểu đúng câu hỏi của bạn. Bạn có thể cung cấp thêm chi tiết cụ thể về vấn đề bạn cần trợ giúp không?`
    : `I found some articles that might be relevant: ${topics}. However, I want to make sure I understand your question correctly. Could you provide more specific details about what you need help with?`;
}

