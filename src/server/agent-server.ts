// Main agent server for managing multiple LLM instances
import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { randomUUID } from 'crypto';
import { AgentInstance } from './agent-instance.js';
import { TopologyManager } from './topology-manager.js';
import { LayeredMemoryStore } from '../memory/layered-store.js';
import {
  AgentTopology,
  ServerConfig,
  InteractionRequest,
  StreamMessage,
  AgentInstanceState
} from './types.js';

export class AgentServer {
  private app: Express;
  private server?: HttpServer;
  private wss?: WebSocketServer;
  private config: ServerConfig;
  private topology?: TopologyManager;
  private instances = new Map<string, AgentInstance>();
  private instancesByNode = new Map<string, AgentInstance[]>();
  private memory: LayeredMemoryStore;
  private apiKey: string;
  private clients = new Set<WebSocket>();

  constructor(config: ServerConfig, apiKey: string) {
    this.config = config;
    this.apiKey = apiKey;
    this.app = express();
    this.memory = new LayeredMemoryStore(config.memoryDir);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Submit topology configuration
    this.app.post('/topology', (req: Request, res: Response) => {
      try {
        const topology: AgentTopology = req.body;
        this.loadTopology(topology);
        res.json({ success: true, message: 'Topology loaded successfully' });
      } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
      }
    });

    // Get topology visualization
    this.app.get('/topology', (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(404).json({ error: 'No topology loaded' });
        return;
      }
      res.json(this.topology.getVisualizationData());
    });

    // Get all instances grouped by node
    this.app.get('/instances', (req: Request, res: Response) => {
      const grouped: Record<string, AgentInstanceState[]> = {};
      
      for (const [nodeId, instances] of this.instancesByNode) {
        grouped[nodeId] = instances.map(inst => inst.getState());
      }
      
      res.json(grouped);
    });

    // Get specific instance details
    this.app.get('/instances/:id', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }
      res.json(instance.getState());
    });

    // Get instance runtime history
    this.app.get('/instances/:id/history', async (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }
      
      try {
        const history = await instance.getRuntimeHistory();
        res.json({ history });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Interact with instance (send new prompt)
    this.app.post('/instances/:id/interact', async (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }

      try {
        const { prompt } = req.body as { prompt: string };
        const result = await instance.interactWithUser(prompt);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Pause instance
    this.app.post('/instances/:id/pause', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }
      instance.pause();
      res.json({ success: true });
    });

    // Resume instance
    this.app.post('/instances/:id/resume', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }
      instance.resume();
      res.json({ success: true });
    });

    // Restart instance
    this.app.post('/instances/:id/restart', async (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }
      
      try {
        await instance.restart();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Execute task
    this.app.post('/execute', async (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(400).json({ error: 'No topology loaded' });
        return;
      }

      try {
        const input = req.body;
        const executionId = randomUUID();
        
        // Start async execution
        this.executeTopology(input, executionId).catch(error => {
          this.log('error', `Execution ${executionId} failed: ${error.message}`);
        });
        
        res.json({ success: true, executionId });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });
  }

  private loadTopology(topology: AgentTopology): void {
    this.topology = new TopologyManager(topology);
    
    // Clear existing instances
    this.instances.clear();
    this.instancesByNode.clear();

    // Create instances for each node
    for (const node of topology.nodes) {
      const parallelCount = node.parallel || 1;
      const instances: AgentInstance[] = [];

      for (let i = 0; i < parallelCount; i++) {
        const instance = new AgentInstance(node, this.apiKey, this.config.memoryDir);
        
        // Setup event listeners
        this.setupInstanceListeners(instance);
        
        instances.push(instance);
        this.instances.set(instance.getId(), instance);
      }

      this.instancesByNode.set(node.id, instances);
    }

    this.log('info', `Topology loaded: ${topology.nodes.length} nodes, ${this.instances.size} instances`);
  }

  private setupInstanceListeners(instance: AgentInstance): void {
    instance.on('output', (msg: StreamMessage) => {
      this.broadcast(msg);
    });

    instance.on('prompt', (msg: StreamMessage) => {
      this.broadcast(msg);
    });

    instance.on('error', (data: any) => {
      this.broadcast({
        instanceId: instance.getId(),
        type: 'error',
        content: data.error.message,
        timestamp: Date.now()
      });
    });

    instance.on('start', (data: any) => {
      this.broadcast({
        instanceId: instance.getId(),
        type: 'status',
        content: 'started',
        timestamp: Date.now()
      });
    });

    instance.on('complete', (data: any) => {
      this.broadcast({
        instanceId: instance.getId(),
        type: 'status',
        content: 'completed',
        timestamp: Date.now()
      });
    });
  }

  private async executeTopology(input: any, executionId: string): Promise<void> {
    if (!this.topology) {
      throw new Error('No topology loaded');
    }

    const executionOrder = this.topology.getExecutionOrder();
    let currentData = input;

    for (const node of executionOrder) {
      this.log('info', `Executing node: ${node.name} (${node.id})`);
      
      const instances = this.instancesByNode.get(node.id) || [];
      
      if (instances.length === 0) {
        throw new Error(`No instances found for node: ${node.id}`);
      }

      // Parallel execution for multiple instances
      if (instances.length > 1) {
        const results = await Promise.all(
          instances.map(inst => inst.execute(currentData))
        );
        currentData = { parallelResults: results };
      } else {
        currentData = await instances[0].execute(currentData);
      }
    }

    this.log('info', `Execution ${executionId} completed`);
    this.broadcast({
      instanceId: executionId,
      type: 'status',
      content: `execution_complete: ${JSON.stringify(currentData)}`,
      timestamp: Date.now()
    });
  }

  private broadcast(message: StreamMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        this.log('info', `Server listening on port ${this.config.port}`);
        
        // Setup WebSocket server
        this.wss = new WebSocketServer({ server: this.server });
        
        this.wss.on('connection', (ws: WebSocket) => {
          this.log('info', 'Client connected');
          this.clients.add(ws);
          
          ws.on('close', () => {
            this.log('info', 'Client disconnected');
            this.clients.delete(ws);
          });
          
          ws.on('error', (error) => {
            this.log('error', `WebSocket error: ${error.message}`);
          });
        });
        
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }
      if (this.server) {
        this.server.close(() => {
          this.log('info', 'Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getInstances(): Map<string, AgentInstance> {
    return this.instances;
  }

  getTopology(): TopologyManager | undefined {
    return this.topology;
  }
}
