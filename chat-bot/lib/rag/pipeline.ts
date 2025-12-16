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

const CONFIDENCE_THRESHOLD = 0.35; // Minimum confidence to answer directly (lowered)
const LOW_CONFIDENCE_THRESHOLD = 0.1; // Below this, ask for clarification (lowered to match DB filter)
const HANDOFF_CONFIDENCE_THRESHOLD = 0.6; // Below 60% confidence, trigger handoff

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
  console.time('Vector Search');
  const { results, confidence } = await searchSimilarArticles(userMessage);
  console.timeEnd('Vector Search');
  console.log(`🔍 Confidence Score: ${confidence}`); // Debug log

  // Step 2: Check for handoff triggers
  const handoffKeywords = [
    "nói chuyện với người",
    "nói chuyện với nhân viên",
    "gặp nhân viên",
    "human",
    "agent",
    "support agent",
    "speak to someone",
    "talk to human",
    "talk to agent",
    "connect me with",
    "kết nối với",
    "chuyển cho",
  ];
  
  const userMessageLower = userMessage.toLowerCase();
  const hasHandoffKeyword = handoffKeywords.some(keyword => 
    userMessageLower.includes(keyword.toLowerCase())
  );

  // Check if confidence is below handoff threshold OR user requested human
  const shouldHandoff = confidence < HANDOFF_CONFIDENCE_THRESHOLD || hasHandoffKeyword;

  if (shouldHandoff) {
    // Trigger handoff - route to human
    // Detect language and respond accordingly
    const isVietnamese = /[\u00C0-\u1EF9]/.test(userMessage) || /tiếng|việt|sao|gì|nào|làm|thế/i.test(userMessage);
    
    let handoffReason: string;
    if (hasHandoffKeyword) {
      handoffReason = "User requested human";
    } else {
      handoffReason = `Low Confidence - ${Math.round(confidence * 100)}%`;
    }

    const response = isVietnamese
      ? "Tôi hiểu bạn muốn được kết nối với nhân viên hỗ trợ. Tôi sẽ tạo ticket hỗ trợ cho bạn ngay bây giờ. Vui lòng cung cấp tên và email của bạn để chúng tôi có thể liên hệ."
      : "I understand you'd like to speak with a human support agent. I'll create a support ticket for you right away. Please provide your name and email so we can contact you.";

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

  // Step 3: Check for very low confidence (below LOW_CONFIDENCE_THRESHOLD)
  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    // Very low confidence - ask for clarification
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

  // Step 4: Check for low confidence (below CONFIDENCE_THRESHOLD but above LOW_CONFIDENCE_THRESHOLD)
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

  // Step 5: High confidence - generate answer with context
  const context = buildContextFromResults(results);
  const systemPrompt = buildSystemPrompt();

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${userMessage}\n\nPlease answer based ONLY on the provided context. If the answer is not in the context, say so.` },
  ];

  console.time('DeepSeek Generation');
  const completion = await generateChatCompletion({
    messages,
    temperature: 0.7,
    maxTokens: 2000,
  });
  console.timeEnd('DeepSeek Generation');

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

  // Step 2: Check for handoff triggers
  const handoffKeywords = [
    "nói chuyện với người",
    "nói chuyện với nhân viên",
    "gặp nhân viên",
    "human",
    "agent",
    "support agent",
    "speak to someone",
    "talk to human",
    "talk to agent",
    "connect me with",
    "kết nối với",
    "chuyển cho",
  ];
  
  const userMessageLower = userMessage.toLowerCase();
  const hasHandoffKeyword = handoffKeywords.some(keyword => 
    userMessageLower.includes(keyword.toLowerCase())
  );

  // Check if confidence is below handoff threshold OR user requested human
  const shouldHandoff = confidence < HANDOFF_CONFIDENCE_THRESHOLD || hasHandoffKeyword;

  if (shouldHandoff) {
    const isVietnamese = /[\u00C0-\u1EF9]/.test(userMessage) || /tiếng|việt|sao|gì|nào|làm|thế/i.test(userMessage);
    const response = isVietnamese
      ? "Tôi hiểu bạn muốn được kết nối với nhân viên hỗ trợ. Tôi sẽ tạo ticket hỗ trợ cho bạn ngay bây giờ. Vui lòng cung cấp tên và email của bạn để chúng tôi có thể liên hệ."
      : "I understand you'd like to speak with a human support agent. I'll create a support ticket for you right away. Please provide your name and email so we can contact you.";

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

  // Step 3: Check for very low confidence
  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
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
7. **CRITICAL: ANSWER IN THE SAME LANGUAGE AS THE USER'S QUESTION**.
    - If the user asks in English, you MUST answer in English, even if the context is in Vietnamese. TRANSLATE the information from the context.
    - If the user asks in Vietnamese, answer in Vietnamese.
    - Do not just copy the context language if it doesn't match the user's question.`;
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

