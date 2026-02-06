/**
 * GeminiConnector - Interface with Google's Gemini AI platform
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ThinkingStyle } from '../blueprint/schemas.js';

export class GeminiConnector {
  private platform: GoogleGenerativeAI;
  private activeModels: Map<string, GenerativeModel>;

  constructor(credentials: string) {
    if (!credentials) {
      throw new Error('Gemini credentials required');
    }
    this.platform = new GoogleGenerativeAI(credentials);
    this.activeModels = new Map();
  }

  private selectModel(style: ThinkingStyle): string {
    // Choose model based on thinking style characteristics
    if (style.focusNarrowness > 0.8) {
      return 'gemini-1.5-pro';
    }
    return 'gemini-1.5-flash';
  }

  private retrieveModel(style: ThinkingStyle): GenerativeModel {
    const modelName = this.selectModel(style);
    const configKey = `${modelName}_${style.creativity}_${style.outputLimit}`;
    
    if (this.activeModels.has(configKey)) {
      return this.activeModels.get(configKey)!;
    }

    const modelInstance = this.platform.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: style.creativity,
        maxOutputTokens: style.outputLimit,
        topP: style.samplingDiversity,
        topK: Math.floor(40 * style.samplingDiversity),
      },
    });

    this.activeModels.set(configKey, modelInstance);
    return modelInstance;
  }

  async generateResponse(instruction: string, style: ThinkingStyle): Promise<string> {
    try {
      const modelInstance = this.retrieveModel(style);
      const outcome = await modelInstance.generateContent(instruction);
      const reply = await outcome.response;
      return reply.text();
    } catch (err) {
      throw new Error(`Gemini interaction failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async *streamResponse(
    instruction: string,
    style: ThinkingStyle
  ): AsyncGenerator<string, void, unknown> {
    try {
      const modelInstance = this.retrieveModel(style);
      const outcome = await modelInstance.generateContentStream(instruction);

      for await (const fragment of outcome.stream) {
        const textPart = fragment.text();
        if (textPart) {
          yield textPart;
        }
      }
    } catch (err) {
      throw new Error(`Gemini streaming failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  initiateConversation(style: ThinkingStyle, priorMessages: Array<{ role: string; content: string }> = []) {
    const modelInstance = this.retrieveModel(style);
    return modelInstance.startChat({
      history: priorMessages.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }],
      })),
    });
  }
}
