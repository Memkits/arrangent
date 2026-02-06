/**
 * Stream Router - Unidirectional data channel management
 */

import { promises as fsPromises } from 'fs';
import { join as pathJoin } from 'path';
import { WorkPacket, StreamConnection } from '../blueprint/schemas.js';

export class StreamRouter {
  private channelRoot: string;
  private routingTable: StreamConnection[];

  constructor(channelRoot: string = './transfer', routingTable: StreamConnection[] = []) {
    this.channelRoot = channelRoot;
    this.routingTable = routingTable;
  }

  private async prepareChannel(channelPath: string): Promise<string> {
    const fullChannelPath = pathJoin(this.channelRoot, channelPath);
    await fsPromises.mkdir(fullChannelPath, { recursive: true });
    return fullChannelPath;
  }

  async publishPacket(channelPath: string, packet: WorkPacket): Promise<void> {
    const channelDir = await this.prepareChannel(channelPath);
    const packetFilename = `${packet.packetId}.json`;
    const fullPath = pathJoin(channelDir, packetFilename);

    const serialized = JSON.stringify(packet, null, 2);
    await fsPromises.writeFile(fullPath, serialized, 'utf-8');
  }

  async consumePacket(channelPath: string, packetId: string): Promise<WorkPacket | null> {
    try {
      const fullPath = pathJoin(this.channelRoot, channelPath, `${packetId}.json`);
      const rawContent = await fsPromises.readFile(fullPath, 'utf-8');
      return JSON.parse(rawContent) as WorkPacket;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async consumeAllPackets(channelPath: string): Promise<WorkPacket[]> {
    try {
      const fullPath = pathJoin(this.channelRoot, channelPath);
      const entries = await fsPromises.readdir(fullPath);
      const jsonEntries = entries.filter(f => f.endsWith('.json'));

      const packets = await Promise.all(
        jsonEntries.map(async (entry) => {
          const rawContent = await fsPromises.readFile(pathJoin(fullPath, entry), 'utf-8');
          return JSON.parse(rawContent) as WorkPacket;
        })
      );

      return packets.sort((a, b) => 
        a.provenance.createdAt.getTime() - b.provenance.createdAt.getTime()
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  findDownstreamChannel(upstreamPersona: string): string | null {
    const route = this.routingTable.find(r => r.upstream === upstreamPersona);
    return route ? route.channelPath : null;
  }

  findUpstreamPersonas(channelPath: string): string[] {
    return this.routingTable
      .filter(r => r.channelPath === channelPath)
      .map(r => r.upstream);
  }

  detectCycles(): { hasCycles: boolean; cycleChains?: string[] } {
    const adjacencyMap: Map<string, string[]> = new Map();

    for (const route of this.routingTable) {
      if (!adjacencyMap.has(route.upstream)) {
        adjacencyMap.set(route.upstream, []);
      }
      adjacencyMap.get(route.upstream)!.push(route.downstream);
    }

    const exploredNodes = new Set<string>();
    const activeStack = new Set<string>();
    const detectedCycles: string[] = [];

    const exploreNode = (node: string, trail: string[]): boolean => {
      exploredNodes.add(node);
      activeStack.add(node);
      trail.push(node);

      const adjacent = adjacencyMap.get(node) || [];
      for (const neighbor of adjacent) {
        if (!exploredNodes.has(neighbor)) {
          if (exploreNode(neighbor, [...trail])) {
            return true;
          }
        } else if (activeStack.has(neighbor)) {
          detectedCycles.push([...trail, neighbor].join(' → '));
          return true;
        }
      }

      activeStack.delete(node);
      return false;
    };

    for (const node of adjacencyMap.keys()) {
      if (!exploredNodes.has(node)) {
        exploreNode(node, []);
      }
    }

    return {
      hasCycles: detectedCycles.length > 0,
      cycleChains: detectedCycles.length > 0 ? detectedCycles : undefined,
    };
  }

  async clearChannel(channelPath: string): Promise<void> {
    const fullPath = pathJoin(this.channelRoot, channelPath);
    try {
      await fsPromises.rm(fullPath, { recursive: true, force: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  generateGraphviz(): string {
    let dotGraph = 'digraph StreamFlow {\n';
    dotGraph += '  rankdir=LR;\n';
    dotGraph += '  node [shape=box, style=rounded];\n\n';

    for (const route of this.routingTable) {
      dotGraph += `  "${route.upstream}" -> "${route.downstream}" [label="${route.channelPath}"];\n`;
    }

    dotGraph += '}\n';
    return dotGraph;
  }
}
