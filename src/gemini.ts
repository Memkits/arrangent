// Gemini API wrapper
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiAPI {
  private ai: GoogleGenerativeAI;
  private cache = new Map();

  constructor(key: string) {
    this.ai = new GoogleGenerativeAI(key);
  }

  async run(prompt: string, opts: { temp: number; tokens: number }) {
    const key = `${opts.temp}_${opts.tokens}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, this.ai.getGenerativeModel({
        model: opts.temp > 0.5 ? 'gemini-1.5-flash' : 'gemini-1.5-pro',
        generationConfig: { temperature: opts.temp, maxOutputTokens: opts.tokens }
      }));
    }
    const result = await this.cache.get(key).generateContent(prompt);
    return (await result.response).text();
  }
}
