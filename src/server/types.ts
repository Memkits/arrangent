// Server types for agent management

export type AgentStatus = 
  | 'idle'       // Not running, waiting for work
  | 'running'    // Currently executing
  | 'waiting'    // Waiting for user input
  | 'paused'     // Paused by user
  | 'error'      // Error occurred
  | 'completed'; // Finished successfully

export interface AgentInstanceState {
  id: string;
  nodeId: string;
  status: AgentStatus;
  startTime: number;
  lastUpdate: number;
  progress: number;
  currentPrompt?: string;
  lastOutput?: string;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface NodeConfig {
  id: string;
  name: string;
  type: 'splitter' | 'worker' | 'validator' | 'merger';
  geminiSettings: {
    temp: number;
    tokens: number;
  };
  parallel?: number; // Number of instances to spawn
  dependencies: string[]; // IDs of nodes this depends on
}

export interface AgentTopology {
  nodes: NodeConfig[];
  connections: Array<{
    from: string;
    to: string;
    channel: string;
  }>;
}

export interface ServerConfig {
  port: number;
  memoryDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface InteractionRequest {
  instanceId: string;
  prompt: string;
  continueExecution: boolean;
}

export interface StreamMessage {
  instanceId: string;
  type: 'output' | 'error' | 'status' | 'prompt';
  content: string;
  timestamp: number;
}
