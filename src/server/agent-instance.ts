// Individual agent instance management
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { GeminiAPI } from '../gemini.js';
import { LayeredMemoryStore } from '../memory/layered-store.js';
import { AgentInstanceState, AgentStatus, NodeConfig } from './types.js';

export class AgentInstance extends EventEmitter {
  private state: AgentInstanceState;
  private gemini: GeminiAPI;
  private memory: LayeredMemoryStore;
  private executionQueue: Array<{ input: any; resolve: Function; reject: Function }> = [];
  private isProcessing = false;

  constructor(
    private nodeConfig: NodeConfig,
    private apiKey: string,
    memoryDir: string
  ) {
    super();
    this.gemini = new GeminiAPI(apiKey);
    this.memory = new LayeredMemoryStore(memoryDir);
    
    this.state = {
      id: randomUUID(),
      nodeId: nodeConfig.id,
      status: 'idle',
      startTime: Date.now(),
      lastUpdate: Date.now(),
      progress: 0,
      metadata: {}
    };
  }

  getId(): string {
    return this.state.id;
  }

  getState(): AgentInstanceState {
    return { ...this.state };
  }

  getNodeId(): string {
    return this.nodeConfig.id;
  }

  async initialize(): Promise<void> {
    // Save base config to memory
    await this.memory.writeBaseConfig(this.nodeConfig.id, this.nodeConfig);
    
    // Save initial instance state
    await this.memory.writeInstanceState(
      this.nodeConfig.id,
      this.state.id,
      this.state
    );
    
    this.emit('initialized', this.state);
  }

  async execute(input: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.executionQueue.push({ input, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { input, resolve, reject } = this.executionQueue.shift()!;

    try {
      this.updateStatus('running');
      this.emit('start', { instanceId: this.state.id, input });

      const executionId = randomUUID();
      const prompt = this.buildPrompt(input);
      
      this.state.currentPrompt = prompt;
      await this.saveInstanceState();

      // Stream output
      this.emit('output', {
        instanceId: this.state.id,
        type: 'output',
        content: `Processing with ${this.nodeConfig.type}...\n`,
        timestamp: Date.now()
      });

      const result = await this.gemini.run(prompt, this.nodeConfig.geminiSettings);
      
      this.state.lastOutput = result;
      this.state.progress = 100;
      await this.saveInstanceState();

      // Save to runtime memory
      await this.memory.writeRuntimeMemory(
        this.nodeConfig.id,
        this.state.id,
        executionId,
        JSON.stringify({ input, output: result, timestamp: Date.now() }, null, 2)
      );

      this.emit('output', {
        instanceId: this.state.id,
        type: 'output',
        content: result,
        timestamp: Date.now()
      });

      const parsed = this.parseResult(result);
      this.updateStatus('completed');
      this.emit('complete', { instanceId: this.state.id, output: parsed });
      
      resolve(parsed);
    } catch (error) {
      this.state.errorMessage = (error as Error).message;
      await this.saveInstanceState();
      this.updateStatus('error');
      this.emit('error', { instanceId: this.state.id, error });
      reject(error);
    } finally {
      this.isProcessing = false;
      // Process next item if any
      if (this.executionQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  async interactWithUser(userPrompt: string): Promise<any> {
    this.updateStatus('running');
    this.emit('interaction', { instanceId: this.state.id, prompt: userPrompt });

    try {
      const executionId = randomUUID();
      const result = await this.gemini.run(userPrompt, this.nodeConfig.geminiSettings);
      
      this.state.lastOutput = result;
      await this.saveInstanceState();

      // Save interaction to runtime memory
      await this.memory.writeRuntimeMemory(
        this.nodeConfig.id,
        this.state.id,
        executionId,
        JSON.stringify({ input: { userPrompt }, output: result, timestamp: Date.now() }, null, 2)
      );

      const parsed = this.parseResult(result);
      this.updateStatus('waiting'); // Back to waiting for more interaction
      
      return parsed;
    } catch (error) {
      this.state.errorMessage = (error as Error).message;
      await this.saveInstanceState();
      this.updateStatus('error');
      throw error;
    }
  }

  pause(): void {
    if (this.state.status === 'running') {
      this.updateStatus('paused');
      this.emit('paused', { instanceId: this.state.id });
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.updateStatus('running');
      this.emit('resumed', { instanceId: this.state.id });
      this.processQueue();
    }
  }

  async restart(): Promise<void> {
    this.executionQueue = [];
    this.isProcessing = false;
    await this.memory.clearRuntimeMemory(this.nodeConfig.id, this.state.id);
    this.updateStatus('idle');
    this.state.progress = 0;
    this.state.errorMessage = undefined;
    await this.saveInstanceState();
    this.emit('restarted', { instanceId: this.state.id });
  }

  requestUserInput(promptMessage: string): void {
    this.updateStatus('waiting');
    this.emit('prompt', {
      instanceId: this.state.id,
      type: 'prompt',
      content: promptMessage,
      timestamp: Date.now()
    });
  }

  private buildPrompt(input: any): string {
    const type = this.nodeConfig.type;
    const data = JSON.stringify(input);
    
    const prompts: Record<string, string> = {
      splitter: `Break this task into subtasks. Input: ${data}. Return JSON: {"subtasks": [...]}`,
      worker: `Process this work. Input: ${data}. Return JSON: {"result": "...", "confidence": 0.9}`,
      validator: `Check quality. Input: ${data}. Return JSON: {"score": 0.95, "pass": true}`,
      merger: `Combine results. Input: ${data}. Return JSON: {"final": "..."}`
    };
    
    return prompts[type] || `Process: ${data}`;
  }

  private parseResult(text: string): any {
    try {
      const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      return match ? JSON.parse(match[1]) : { raw: text };
    } catch {
      return { raw: text };
    }
  }

  private updateStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.lastUpdate = Date.now();
  }

  private async saveInstanceState(): Promise<void> {
    await this.memory.writeInstanceState(
      this.nodeConfig.id,
      this.state.id,
      this.state
    );
  }

  async getRuntimeHistory(): Promise<string[]> {
    return await this.memory.listRuntimeMemories(this.nodeConfig.id, this.state.id);
  }
}
