// Topology manager for dependency resolution and execution ordering
import { AgentTopology, NodeConfig } from './types.js';

export class TopologyManager {
  private topology: AgentTopology;
  private sortedNodes: NodeConfig[] = [];

  constructor(topology: AgentTopology) {
    this.topology = topology;
    this.sortedNodes = this.topologicalSort();
  }

  /**
   * Performs topological sort on nodes based on dependencies
   * Returns nodes in execution order
   */
  private topologicalSort(): NodeConfig[] {
    const nodes = [...this.topology.nodes];
    const sorted: NodeConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node: ${nodeId}`);
      }

      visiting.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      // Visit dependencies first
      for (const depId of node.dependencies) {
        visit(depId);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      sorted.push(node);
    };

    // Visit all nodes
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return sorted;
  }

  /**
   * Get nodes in topological order (execution order)
   */
  getExecutionOrder(): NodeConfig[] {
    return [...this.sortedNodes];
  }

  /**
   * Get dependencies for a specific node
   */
  getDependencies(nodeId: string): string[] {
    const node = this.topology.nodes.find(n => n.id === nodeId);
    return node ? [...node.dependencies] : [];
  }

  /**
   * Get dependents (nodes that depend on this node)
   */
  getDependents(nodeId: string): string[] {
    return this.topology.nodes
      .filter(n => n.dependencies.includes(nodeId))
      .map(n => n.id);
  }

  /**
   * Get all connections from a node
   */
  getOutgoingConnections(nodeId: string): Array<{ to: string; channel: string }> {
    return this.topology.connections
      .filter(c => c.from === nodeId)
      .map(c => ({ to: c.to, channel: c.channel }));
  }

  /**
   * Get all connections to a node
   */
  getIncomingConnections(nodeId: string): Array<{ from: string; channel: string }> {
    return this.topology.connections
      .filter(c => c.to === nodeId)
      .map(c => ({ from: c.from, channel: c.channel }));
  }

  /**
   * Check if execution can start for a node (all dependencies satisfied)
   */
  canExecute(nodeId: string, completedNodes: Set<string>): boolean {
    const deps = this.getDependencies(nodeId);
    return deps.every(depId => completedNodes.has(depId));
  }

  /**
   * Get nodes that can be executed next
   */
  getNextExecutable(completedNodes: Set<string>): NodeConfig[] {
    return this.sortedNodes.filter(node => {
      return !completedNodes.has(node.id) && this.canExecute(node.id, completedNodes);
    });
  }

  /**
   * Get node configuration by ID
   */
  getNode(nodeId: string): NodeConfig | undefined {
    return this.topology.nodes.find(n => n.id === nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): NodeConfig[] {
    return [...this.topology.nodes];
  }

  /**
   * Get topology visualization data for CLI display
   */
  getVisualizationData(): {
    nodes: Array<{ id: string; name: string; level: number; parallel: number }>;
    edges: Array<{ from: string; to: string; label: string }>;
  } {
    // Calculate levels for visualization
    const levels = new Map<string, number>();
    
    for (const node of this.sortedNodes) {
      const deps = this.getDependencies(node.id);
      if (deps.length === 0) {
        levels.set(node.id, 0);
      } else {
        const maxDepLevel = Math.max(...deps.map(d => levels.get(d) || 0));
        levels.set(node.id, maxDepLevel + 1);
      }
    }

    const nodes = this.topology.nodes.map(n => ({
      id: n.id,
      name: n.name,
      level: levels.get(n.id) || 0,
      parallel: n.parallel || 1
    }));

    const edges = this.topology.connections.map(c => ({
      from: c.from,
      to: c.to,
      label: c.channel
    }));

    return { nodes, edges };
  }
}
