import { GoogleGenerativeAI } from '@google/generative-ai';
import { type Result, ok, err } from '@svg-spawn/core';
import { AiError } from '../errors.js';

/**
 * Interface for an AI client that can generate text content.
 */
export interface AiClient {
  generateContent(prompt: string, systemPrompt: string): Promise<Result<string, AiError>>;
}

/**
 * Gemini API client implementation using the @google/generative-ai SDK.
 */
export class GeminiClient implements AiClient {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private apiKey: string,
    private modelId: string,
  ) {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async generateContent(prompt: string, systemPrompt: string): Promise<Result<string, AiError>> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelId,
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        return err(new AiError('Empty response from Gemini API', 'unknown'));
      }

      return ok(text);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
          return err(new AiError(`Rate limit exceeded: ${error.message}`, 'rate_limit'));
        }
        if (message.includes('401') || message.includes('403') || message.includes('api key') || message.includes('authentication')) {
          return err(new AiError(`Authentication failed: ${error.message}`, 'auth'));
        }
        if (message.includes('timeout') || message.includes('deadline')) {
          return err(new AiError(`Request timed out: ${error.message}`, 'timeout'));
        }

        return err(new AiError(error.message, 'unknown'));
      }

      return err(new AiError('Unknown error occurred', 'unknown'));
    }
  }
}

/**
 * Mock AI client for testing. Returns pre-queued responses in order.
 */
export class MockAiClient implements AiClient {
  private index = 0;

  constructor(private responses: Array<Result<string, AiError>>) {}

  async generateContent(_prompt: string, _systemPrompt: string): Promise<Result<string, AiError>> {
    if (this.index >= this.responses.length) {
      return err(new AiError('MockAiClient: no more responses in queue', 'unknown'));
    }
    const response = this.responses[this.index]!;
    this.index++;
    return response;
  }
}
