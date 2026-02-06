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
    
    // Enable CORS for web clients
    this.app.use((req: Request, res: Response, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });
    
    // API discovery endpoint
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.json({
        apiVersion: 'arrangent.io/v1',
        kind: 'APIResourceList',
        groupVersion: 'arrangent.io/v1',
        resources: [
          { name: 'topologies', namespaced: true, kind: 'Topology', verbs: ['get', 'list', 'create', 'update', 'delete'] },
          { name: 'nodes', namespaced: true, kind: 'Node', verbs: ['get', 'list'] },
          { name: 'instances', namespaced: true, kind: 'Instance', verbs: ['get', 'list', 'update', 'delete'] },
          { name: 'executions', namespaced: true, kind: 'Execution', verbs: ['get', 'list', 'create'] }
        ]
      });
    });

    // === K8S-style Topology API ===
    
    // List topologies
    this.app.get('/api/v1/topologies', (req: Request, res: Response) => {
      const items = this.topology ? [this.toK8sTopology()] : [];
      res.json({
        apiVersion: 'arrangent.io/v1',
        kind: 'TopologyList',
        metadata: { resourceVersion: '1' },
        items
      });
    });
    
    // Create/Update topology
    this.app.post('/api/v1/topologies', (req: Request, res: Response) => {
      try {
        const k8sTopology = req.body;
        const topology: AgentTopology = {
          nodes: k8sTopology.spec?.nodes || [],
          connections: k8sTopology.spec?.connections || []
        };
        this.loadTopology(topology);
        res.status(201).json(this.toK8sTopology());
      } catch (error) {
        res.status(400).json(this.toK8sError(400, (error as Error).message));
      }
    });
    
    // Get topology by name
    this.app.get('/api/v1/topologies/:name', (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(404).json(this.toK8sError(404, 'Topology not found'));
        return;
      }
      res.json(this.toK8sTopology());
    });
    
    // Delete topology
    this.app.delete('/api/v1/topologies/:name', (req: Request, res: Response) => {
      this.topology = undefined;
      this.instances.clear();
      this.instancesByNode.clear();
      res.json({
        apiVersion: 'arrangent.io/v1',
        kind: 'Status',
        status: 'Success',
        code: 200
      });
    });
    
    // Get topology status
    this.app.get('/api/v1/topologies/:name/status', (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(404).json(this.toK8sError(404, 'Topology not found'));
        return;
      }
      const k8sTopo = this.toK8sTopology();
      res.json({ status: k8sTopo.status });
    });

    // === K8S-style Node API ===
    
    // List nodes
    this.app.get('/api/v1/nodes', (req: Request, res: Response) => {
      const items = Array.from(this.instancesByNode.entries()).map(([nodeId, instances]) => {
        return this.toK8sNode(nodeId, instances);
      });
      res.json({
        apiVersion: 'arrangent.io/v1',
        kind: 'NodeList',
        metadata: { resourceVersion: '1' },
        items
      });
    });
    
    // Get specific node
    this.app.get('/api/v1/nodes/:id', (req: Request, res: Response) => {
      const nodeId = String(req.params.id);
      const instances = this.instancesByNode.get(nodeId);
      if (!instances) {
        res.status(404).json(this.toK8sError(404, 'Node not found'));
        return;
      }
      res.json(this.toK8sNode(nodeId, instances));
    });
    
    // List instances for a node
    this.app.get('/api/v1/nodes/:id/instances', (req: Request, res: Response) => {
      const nodeId = String(req.params.id);
      const instances = this.instancesByNode.get(nodeId);
      if (!instances) {
        res.status(404).json(this.toK8sError(404, 'Node not found'));
        return;
      }
      const items = instances.map(inst => this.toK8sInstance(inst));
      res.json({
        apiVersion: 'arrangent.io/v1',
        kind: 'InstanceList',
        metadata: { resourceVersion: '1' },
        items
      });
    });

    // === K8S-style Instance API ===
    
    // List all instances
    this.app.get('/api/v1/instances', (req: Request, res: Response) => {
      const items = Array.from(this.instances.values()).map(inst => this.toK8sInstance(inst));
      res.json({
        apiVersion: 'arrangent.io/v1',
        kind: 'InstanceList',
        metadata: { resourceVersion: '1' },
        items
      });
    });
    
    // Get specific instance
    this.app.get('/api/v1/instances/:id', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json(this.toK8sError(404, 'Instance not found'));
        return;
      }
      res.json(this.toK8sInstance(instance));
    });
    
    // Get instance status
    this.app.get('/api/v1/instances/:id/status', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json(this.toK8sError(404, 'Instance not found'));
        return;
      }
      const k8sInst = this.toK8sInstance(instance);
      res.json({ status: k8sInst.status });
    });
    
    // Update instance status (pause/resume)
    this.app.put('/api/v1/instances/:id/status', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json(this.toK8sError(404, 'Instance not found'));
        return;
      }
      
      const { action } = req.body;
      if (action === 'pause') {
        instance.pause();
      } else if (action === 'resume') {
        instance.resume();
      }
      
      res.json(this.toK8sInstance(instance));
    });
    
    // Interact with instance
    this.app.post('/api/v1/instances/:id/interact', async (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json(this.toK8sError(404, 'Instance not found'));
        return;
      }

      try {
        const { prompt } = req.body;
        const result = await instance.interactWithUser(prompt);
        res.json({
          apiVersion: 'arrangent.io/v1',
          kind: 'InteractionResult',
          result
        });
      } catch (error) {
        res.status(500).json(this.toK8sError(500, (error as Error).message));
      }
    });
    
    // Delete/stop instance
    this.app.delete('/api/v1/instances/:id', async (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json(this.toK8sError(404, 'Instance not found'));
        return;
      }
      
      try {
        await instance.restart(); // Restart to clear state
        res.json({
          apiVersion: 'arrangent.io/v1',
          kind: 'Status',
          status: 'Success',
          code: 200
        });
      } catch (error) {
        res.status(500).json(this.toK8sError(500, (error as Error).message));
      }
    });

    // === K8S-style Execution API ===
    
    // Create execution
    this.app.post('/api/v1/executions', async (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(400).json(this.toK8sError(400, 'No topology loaded'));
        return;
      }

      try {
        const input = req.body.input || req.body;
        const executionId = randomUUID();
        
        // Start async execution
        this.executeTopology(input, executionId).catch(error => {
          this.log('error', `Execution ${executionId} failed: ${error.message}`);
        });
        
        res.status(201).json({
          apiVersion: 'arrangent.io/v1',
          kind: 'Execution',
          metadata: {
            name: executionId,
            uid: executionId,
            createdAt: new Date().toISOString()
          },
          spec: { input },
          status: { phase: 'Running' }
        });
      } catch (error) {
        res.status(500).json(this.toK8sError(500, (error as Error).message));
      }
    });

    // === Legacy endpoints for backwards compatibility ===
    
    this.app.post('/topology', (req: Request, res: Response) => {
      try {
        const topology: AgentTopology = req.body;
        this.loadTopology(topology);
        res.json({ success: true, message: 'Topology loaded successfully' });
      } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.get('/topology', (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(404).json({ error: 'No topology loaded' });
        return;
      }
      res.json(this.topology.getVisualizationData());
    });

    this.app.get('/instances', (req: Request, res: Response) => {
      const grouped: Record<string, AgentInstanceState[]> = {};
      for (const [nodeId, instances] of this.instancesByNode) {
        grouped[nodeId] = instances.map(inst => inst.getState());
      }
      res.json(grouped);
    });

    this.app.get('/instances/:id', (req: Request, res: Response) => {
      const instanceId = String(req.params.id);
      const instance = this.instances.get(instanceId);
      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }
      res.json(instance.getState());
    });

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

    this.app.post('/execute', async (req: Request, res: Response) => {
      if (!this.topology) {
        res.status(400).json({ error: 'No topology loaded' });
        return;
      }
      try {
        const input = req.body;
        const executionId = randomUUID();
        this.executeTopology(input, executionId).catch(error => {
          this.log('error', `Execution ${executionId} failed: ${error.message}`);
        });
        res.json({ success: true, executionId });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });
  }
  
  private toK8sTopology(): any {
    if (!this.topology) return null;
    
    const topologyData = this.topology.getVisualizationData();
    const nodeStatuses: Record<string, any> = {};
    
    for (const [nodeId, instances] of this.instancesByNode) {
      const readyCount = instances.filter(i => i.getState().status === 'completed' || i.getState().status === 'idle').length;
      nodeStatuses[nodeId] = {
        instanceCount: instances.length,
        readyInstances: readyCount
      };
    }
    
    return {
      apiVersion: 'arrangent.io/v1',
      kind: 'Topology',
      metadata: {
        name: 'default-topology',
        namespace: 'default',
        uid: 'topology-1',
        createdAt: new Date().toISOString(),
        labels: { 'app': 'arrangent' }
      },
      spec: {
        nodes: topologyData.nodes.map((n: any) => ({
          id: n.id,
          name: n.name,
          type: n.type,
          geminiSettings: n.config,
          dependencies: n.dependencies || []
        })),
        connections: topologyData.edges || []
      },
      status: {
        phase: 'Running',
        conditions: [{
          type: 'Ready',
          status: 'True',
          lastTransitionTime: new Date().toISOString()
        }],
        nodeStatuses
      }
    };
  }
  
  private toK8sNode(nodeId: string, instances: AgentInstance[]): any {
    const firstInstance = instances[0];
    const state = firstInstance.getState();
    
    return {
      apiVersion: 'arrangent.io/v1',
      kind: 'Node',
      metadata: {
        name: nodeId,
        namespace: 'default',
        uid: nodeId,
        createdAt: new Date(state.startTime).toISOString(),
        labels: { 'node-id': nodeId, 'type': state.nodeId }
      },
      spec: {
        id: nodeId,
        name: nodeId,
        type: state.nodeId,
        geminiSettings: state.metadata.geminiSettings || {},
        parallel: instances.length,
        dependencies: []
      },
      status: {
        instanceCount: instances.length,
        instances: instances.map(i => i.getId()),
        conditions: [{
          type: 'Ready',
          status: instances.some(i => i.getState().status === 'running') ? 'True' : 'False',
          lastTransitionTime: new Date().toISOString()
        }]
      }
    };
  }
  
  private toK8sInstance(instance: AgentInstance): any {
    const state = instance.getState();
    
    return {
      apiVersion: 'arrangent.io/v1',
      kind: 'Instance',
      metadata: {
        name: state.id,
        namespace: 'default',
        uid: state.id,
        createdAt: new Date(state.startTime).toISOString(),
        labels: { 'node': state.nodeId, 'instance-id': state.id }
      },
      spec: {
        nodeId: state.nodeId,
        config: {
          type: state.nodeId,
          geminiSettings: state.metadata.geminiSettings || {}
        }
      },
      status: {
        state: state.status,
        progress: state.progress,
        startTime: new Date(state.startTime).toISOString(),
        message: state.lastOutput || state.errorMessage,
        currentPrompt: state.currentPrompt,
        lastOutput: state.lastOutput
      }
    };
  }
  
  private toK8sError(code: number, message: string): any {
    return {
      apiVersion: 'arrangent.io/v1',
      kind: 'Status',
      status: 'Failure',
      message,
      code
    };
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
