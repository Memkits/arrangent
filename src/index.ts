// Core types for the arrangement system
export interface RoleConfig {
  name: string;
  type: 'splitter' | 'worker' | 'validator' | 'merger';
  geminiSettings: { temp: number; tokens: number };
  parallel?: number;
}

export interface FlowConfig {
  roles: RoleConfig[];
  connections: Array<{ from: string; to: string; channel: string }>;
}

export interface Task {
  id: string;
  data: any;
  from: string;
  timestamp: number;
}

export { GeminiAPI } from './gemini.js';
export { FlowEngine } from './engine.js';
export { MemoryStore } from './memory.js';
