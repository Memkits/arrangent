/**
 * Stream Router - Unidirectional data channel management
 */
import { promises as fsPromises } from 'fs';
import { join as pathJoin } from 'path';
export class StreamRouter {
    channelRoot;
    routingTable;
    constructor(channelRoot = './transfer', routingTable = []) {
        this.channelRoot = channelRoot;
        this.routingTable = routingTable;
    }
    async prepareChannel(channelPath) {
        const fullChannelPath = pathJoin(this.channelRoot, channelPath);
        await fsPromises.mkdir(fullChannelPath, { recursive: true });
        return fullChannelPath;
    }
    async publishPacket(channelPath, packet) {
        const channelDir = await this.prepareChannel(channelPath);
        const packetFilename = `${packet.packetId}.json`;
        const fullPath = pathJoin(channelDir, packetFilename);
        const serialized = JSON.stringify(packet, null, 2);
        await fsPromises.writeFile(fullPath, serialized, 'utf-8');
    }
    async consumePacket(channelPath, packetId) {
        try {
            const fullPath = pathJoin(this.channelRoot, channelPath, `${packetId}.json`);
            const rawContent = await fsPromises.readFile(fullPath, 'utf-8');
            return JSON.parse(rawContent);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
    }
    async consumeAllPackets(channelPath) {
        try {
            const fullPath = pathJoin(this.channelRoot, channelPath);
            const entries = await fsPromises.readdir(fullPath);
            const jsonEntries = entries.filter(f => f.endsWith('.json'));
            const packets = await Promise.all(jsonEntries.map(async (entry) => {
                const rawContent = await fsPromises.readFile(pathJoin(fullPath, entry), 'utf-8');
                return JSON.parse(rawContent);
            }));
            return packets.sort((a, b) => a.provenance.createdAt.getTime() - b.provenance.createdAt.getTime());
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return [];
            }
            throw err;
        }
    }
    findDownstreamChannel(upstreamPersona) {
        const route = this.routingTable.find(r => r.upstream === upstreamPersona);
        return route ? route.channelPath : null;
    }
    findUpstreamPersonas(channelPath) {
        return this.routingTable
            .filter(r => r.channelPath === channelPath)
            .map(r => r.upstream);
    }
    detectCycles() {
        const adjacencyMap = new Map();
        for (const route of this.routingTable) {
            if (!adjacencyMap.has(route.upstream)) {
                adjacencyMap.set(route.upstream, []);
            }
            adjacencyMap.get(route.upstream).push(route.downstream);
        }
        const exploredNodes = new Set();
        const activeStack = new Set();
        const detectedCycles = [];
        const exploreNode = (node, trail) => {
            exploredNodes.add(node);
            activeStack.add(node);
            trail.push(node);
            const adjacent = adjacencyMap.get(node) || [];
            for (const neighbor of adjacent) {
                if (!exploredNodes.has(neighbor)) {
                    if (exploreNode(neighbor, [...trail])) {
                        return true;
                    }
                }
                else if (activeStack.has(neighbor)) {
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
    async clearChannel(channelPath) {
        const fullPath = pathJoin(this.channelRoot, channelPath);
        try {
            await fsPromises.rm(fullPath, { recursive: true, force: true });
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
    generateGraphviz() {
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
//# sourceMappingURL=router.js.map