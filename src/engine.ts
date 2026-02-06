// Flow engine - unidirectional data flow
import { randomUUID } from 'crypto';
import { FlowConfig, Task } from './index.js';
import { GeminiAPI } from './gemini.js';
import { MemoryStore } from './memory.js';

export class FlowEngine {
  private gemini: GeminiAPI;
  private memory: MemoryStore;

  constructor(private config: FlowConfig, apiKey: string) {
    this.gemini = new GeminiAPI(apiKey);
    this.memory = new MemoryStore();
  }

  async execute(input: any) {
    let task: Task = { id: randomUUID(), data: input, from: 'user', timestamp: Date.now() };
    
    for (const role of this.config.roles) {
      console.log(`Running ${role.name} (${role.type})...`);
      
      const prompt = this.buildPrompt(role.type, JSON.stringify(task.data));
      const result = await this.gemini.run(prompt, role.geminiSettings);
      
      const output = this.parseResult(result);
      await this.memory.save(role.name, task.id, task.data, output);
      
      task = { id: randomUUID(), data: output, from: role.name, timestamp: Date.now() };
    }
    
    return task.data;
  }

  private buildPrompt(type: string, data: string) {
    const prompts: Record<string, string> = {
      splitter: `Break this task into subtasks. Input: ${data}. Return JSON: {"subtasks": [...]}`,
      worker: `Process this work. Input: ${data}. Return JSON: {"result": "...", "confidence": 0.9}`,
      validator: `Check quality. Input: ${data}. Return JSON: {"score": 0.95, "pass": true}`,
      merger: `Combine results. Input: ${data}. Return JSON: {"final": "..."}`
    };
    return prompts[type] || `Process: ${data}`;
  }

  private parseResult(text: string) {
    try {
      const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      return match ? JSON.parse(match[1]) : { raw: text };
    } catch {
      return { raw: text };
    }
  }

  async stats() {
    const counts = await Promise.all(
      this.config.roles.map(async r => ({ name: r.name, runs: await this.memory.count(r.name) }))
    );
    return { roles: counts };
  }
}
